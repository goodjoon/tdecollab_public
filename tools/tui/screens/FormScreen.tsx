import { Box, Text, useInput } from 'ink';
import { useState } from 'react';
import { COMMANDS, buildPreview, type CommandDef, type FieldDef } from '../command-def.js';
import { AppShell } from '../components/AppShell.js';
import { FilePicker } from '../components/FilePicker.js';
import { FormField } from '../components/FormField.js';
import { HeaderBar } from '../components/HeaderBar.js';
import { Keymap } from '../components/Keymap.js';
import { LogPane } from '../components/LogPane.js';
import { MenuTree } from '../components/MenuTree.js';
import { Panel } from '../components/Panel.js';
import { MENU, META_ITEMS, flattenMenu, pathFromCommandKey, type MenuItem } from '../menu-def.js';
import type { AppState } from '../state.js';
import { T, DEFAULT_ACCENT } from '../theme.js';
import { applyUrlFill, getUrlFillTargets, parseConfluenceUrl, supportsUrlFill } from '../url-parser.js';

interface FormScreenProps {
  state: AppState;
  onRun: (values: Record<string, string | boolean>) => void;
  onBack: () => void;
  onSavePreset: (values: Record<string, string | boolean>) => void;
  accent?: string;
}

// URL 빠른 입력 필드 색상 — 다른 강조색(pink/red/amber)과 hue 차이가 큰 친근한 파랑
const URL_FILL_COLOR = T.blue; // '#60A5FA'

export function FormScreen({ state, onRun, onBack, onSavePreset, accent = DEFAULT_ACCENT }: FormScreenProps) {
  const def: CommandDef | undefined = COMMANDS[state.commandKey];
  const [values, setValues] = useState<Record<string, string | boolean>>(state.formValues);
  const [errors, setErrors] = useState<Record<string, string>>(state.formErrors);
  // URL Quick-fill 필드는 focusIdx = -1 로 표현 (regular 필드는 0~n-1)
  const [focusIdx, setFocusIdx] = useState(state.focusedField);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [urlValue, setUrlValue] = useState('');

  if (!def) return <Text color={T.red}>커맨드를 찾을 수 없습니다: {state.commandKey}</Text>;

  const fields = def.fields;
  const hasUrlFill = supportsUrlFill(state.commandKey);
  const fillTargets = hasUrlFill ? getUrlFillTargets(state.commandKey) : [];
  const onUrlField = hasUrlFill && focusIdx === -1;
  const currentField: FieldDef | undefined = onUrlField ? undefined : fields[focusIdx];
  const preview = buildPreview(def, values);

  // URL 변경 시 자동으로 관련 필드 채우기
  function updateUrl(next: string) {
    setUrlValue(next);
    const parsed = parseConfluenceUrl(next);
    if (parsed.space || parsed.pageId) {
      setValues((v) => applyUrlFill(state.commandKey, parsed, v));
      setErrors({});
    }
  }

  // 필드 인덱스 이동 (URL 필드 -1 포함 가능)
  function nextField() {
    setFocusIdx((i) => {
      const min = hasUrlFill ? -1 : 0;
      const next = i + 1;
      return next > fields.length - 1 ? min : next;
    });
  }
  function prevField() {
    setFocusIdx((i) => {
      const min = hasUrlFill ? -1 : 0;
      const prev = i - 1;
      return prev < min ? fields.length - 1 : prev;
    });
  }

  function validate(): Record<string, string> {
    const errs: Record<string, string> = {};
    for (const f of fields) {
      if (f.required && !values[f.key]) {
        errs[f.key] = `필수 옵션입니다. ${f.hint ?? ''}`;
      }
    }
    return errs;
  }

  function tryRun() {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      const firstErrIdx = fields.findIndex((f) => errs[f.key]);
      if (firstErrIdx >= 0) setFocusIdx(firstErrIdx);
    } else {
      setErrors({});
      onRun(values);
    }
  }

  useInput((input, key) => {
    if (pickerOpen) return; // Picker가 자체적으로 입력 처리

    // === 글로벌 단축키 ===
    // Ctrl+R: Run
    if (key.ctrl && input === 'r') {
      tryRun();
      return;
    }

    // Ctrl+S: Save preset
    if (key.ctrl && input === 's') {
      onSavePreset(values);
      return;
    }

    // Esc: 취소
    if (key.escape) {
      onBack();
      return;
    }

    // === 필드 간 이동 (URL 필드 -1 포함) ===
    if (key.tab && key.shift) {
      prevField();
      return;
    }
    if (key.tab) {
      nextField();
      return;
    }
    if (key.upArrow) {
      prevField();
      return;
    }
    if (key.downArrow) {
      nextField();
      return;
    }

    // === URL Quick-fill 필드 처리 ===
    if (onUrlField) {
      if (key.backspace || key.delete) {
        updateUrl(urlValue.slice(0, -1));
        return;
      }
      if (key.return) return; // Enter 무시
      if (input && !key.ctrl && !key.meta) {
        updateUrl(urlValue + input);
      }
      return;
    }

    if (!currentField) return;

    // === 현재 필드 타입에 따른 처리 ===
    if (currentField.type === 'bool') {
      if (input === ' ' || key.return) {
        setValues((v) => ({ ...v, [currentField.key]: !v[currentField.key] }));
        setErrors((e) => { const n = { ...e }; delete n[currentField.key]; return n; });
      }
      return;
    }

    if (currentField.type === 'select') {
      if (input === ' ' || key.return) {
        const opts = currentField.options ?? [];
        const cur = String(values[currentField.key] ?? opts[0]);
        const nextIdx = (opts.indexOf(cur) + 1) % opts.length;
        setValues((v) => ({ ...v, [currentField.key]: opts[nextIdx] }));
      }
      return;
    }

    // text / path 필드
    if (key.return) {
      // path 필드: 디렉토리 선택창 열기
      if (currentField.pathType) {
        setPickerOpen(true);
        return;
      }
      // 일반 text: Enter는 무시 (필요 시 다음 필드로)
      return;
    }

    // 직접 타이핑: 백스페이스
    if (key.backspace || key.delete) {
      setValues((v) => ({
        ...v,
        [currentField.key]: String(v[currentField.key] ?? '').slice(0, -1),
      }));
      setErrors((e) => { const n = { ...e }; delete n[currentField.key]; return n; });
      return;
    }

    // 일반 문자 입력 (제어키 제외)
    if (input && !key.ctrl && !key.meta) {
      setValues((v) => ({
        ...v,
        [currentField.key]: String(v[currentField.key] ?? '') + input,
      }));
      setErrors((e) => { const n = { ...e }; delete n[currentField.key]; return n; });
    }
  });

  const menuItems = [
    ...flattenMenu(MENU, state.expandedKeys),
    { item: { key: '_sep', label: '─────────────────', dim: true } as MenuItem, depth: 0 },
    ...META_ITEMS.map((m) => ({ item: m, depth: 0 })),
  ];
  const menuCursor = menuItems.findIndex((f) => f.item.commandKey === state.commandKey);

  const crumbs = pathFromCommandKey(state.commandKey);
  const filledCount = fields.filter((f) => values[f.key] !== '' && values[f.key] !== undefined && values[f.key] !== false).length;

  return (
    <AppShell
      header={
        <HeaderBar
          accent={accent}
          crumbs={crumbs}
          status={
            <Box gap={1}>
              <Text color={Object.keys(errors).length > 0 ? T.red : T.mint}>●</Text>
              <Text color={T.fgDim}>
                {Object.keys(errors).length > 0
                  ? `${Object.keys(errors).length} errors`
                  : `${filledCount} / ${fields.length} fields`}
              </Text>
            </Box>
          }
        />
      }
      menu={
        <Panel title="Commands" badge="MENU" accent={accent}>
          <MenuTree items={menuItems} cursor={menuCursor >= 0 ? menuCursor : 0} accent={accent} />
        </Panel>
      }
      body={
        pickerOpen && currentField?.pathType ? (
          <Panel title={`${currentField.label} — 경로 선택`} badge="PICKER" accent={accent} focused>
            <FilePicker
              initialPath={String(values[currentField.key] ?? '')}
              pathType={currentField.pathType}
              accent={accent}
              onSelect={(selected) => {
                setValues((v) => ({ ...v, [currentField.key]: selected }));
                setErrors((e) => { const n = { ...e }; delete n[currentField.key]; return n; });
                setPickerOpen(false);
              }}
              onCancel={() => setPickerOpen(false)}
            />
          </Panel>
        ) : (
          <Panel
            title={def.label}
            badge="FORM"
            accent={accent}
            focused
            headerRight={<Text color={T.amber}>* required</Text>}
          >
            <Box flexDirection="column" paddingY={1}>
              {/* URL Quick-fill (Confluence page 관련 커맨드만) */}
              {hasUrlFill && (
                <Box
                  flexDirection="column"
                  borderStyle="round"
                  borderColor={onUrlField ? URL_FILL_COLOR : T.borderDim}
                  paddingX={1}
                  marginBottom={1}
                >
                  <Box>
                    <Text color={URL_FILL_COLOR} bold>
                      🔗 빠른 입력
                    </Text>
                    <Text color={T.fgFaint}>
                      {' '}— Confluence 페이지 URL을 붙여넣으면{' '}
                    </Text>
                    <Text color={URL_FILL_COLOR} bold>
                      {fillTargets.join(', ')}
                    </Text>
                    <Text color={T.fgFaint}>
                      {' '}필드가 자동 입력됩니다
                    </Text>
                  </Box>
                  <Box marginTop={1}>
                    {urlValue ? (
                      <Text color={T.fg}>{urlValue}</Text>
                    ) : (
                      <Text color={T.fgFaint}>
                        https://confluence.tde.example.com/spaces/TDE/pages/123456/...
                      </Text>
                    )}
                    {onUrlField && <Text backgroundColor={URL_FILL_COLOR} color={T.bg}> </Text>}
                  </Box>
                </Box>
              )}

              {fields.map((f, i) => (
                <FormField
                  key={f.key}
                  field={f}
                  value={values[f.key] ?? ''}
                  focused={i === focusIdx}
                  error={errors[f.key]}
                  accent={accent}
                />
              ))}

              {/* Preview */}
              <Box
                borderStyle="single"
                borderColor={T.borderDim}
                paddingX={1}
                marginTop={1}
                flexDirection="column"
              >
                <Text color={T.fgFaint} bold>PREVIEW</Text>
                <Text>
                  <Text color={T.fgFaint}>$ </Text>
                  <Text color={accent}>tdecollab </Text>
                  <Text color={T.cyan}>{def.key.split(':').join(' ')} </Text>
                  <Text color={T.fg}>{preview.replace(/^tdecollab\s+\S+(?:\s+\S+){0,2}\s*/, '')}</Text>
                </Text>
              </Box>

              {/* 액션 힌트 */}
              <Box gap={3} marginTop={1}>
                <Text backgroundColor={accent} color={T.bg} bold> Ctrl+R Run </Text>
                <Text backgroundColor={T.panelHi} color={T.fg}> Ctrl+S Save preset </Text>
                <Text backgroundColor={T.panelHi} color={T.fgDim}> Esc Back </Text>
              </Box>
            </Box>
          </Panel>
        )
      }
      log={<LogPane lines={state.logs} accent={accent} />}
      footer={
        pickerOpen ? (
          <Keymap accent={accent} keys={[
            { key: '↑↓', label: 'navigate' },
            { key: '↵', label: 'open / select' },
            { key: 'Tab/Spc', label: 'select dir' },
            { key: 'Esc', label: 'cancel' },
          ]} />
        ) : (
          <Keymap accent={accent} keys={[
            { key: 'Tab', label: 'next field' },
            { key: '⇧Tab', label: 'prev' },
            { key: 'A-Z', label: '바로 입력' },
            { key: '↵', label: currentField?.pathType ? '경로 선택창' : currentField?.type === 'bool' ? 'toggle' : '—' },
            { key: 'Ctrl+R', label: 'Run' },
            { key: 'Ctrl+S', label: 'Save' },
            { key: 'Esc', label: 'Back' },
          ]} />
        )
      }
    />
  );
}
