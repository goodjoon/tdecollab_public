import { Box, Text } from 'ink';
import type { FieldDef } from '../command-def.js';
import { T } from '../theme.js';

interface FormFieldProps {
  field: FieldDef;
  value: string | boolean;
  focused: boolean;
  cursor?: number;
  error?: string;
  accent?: string;
}

export function FormField({ field, value, focused, cursor, error, accent = T.pink }: FormFieldProps) {
  const labelText = field.label.padEnd(28);

  if (field.type === 'bool') {
    const checked = value === true;
    return (
      <Box flexDirection="column" marginBottom={0}>
        <Box gap={1}>
          <Text color={focused ? accent : T.fgDim} bold={focused}>
            {labelText}
          </Text>
          <Text color={checked ? accent : T.fgFaint} bold={focused}>
            {checked ? '▣' : '▢'}
          </Text>
          <Text color={focused ? T.fg : T.fgDim}>
            {checked ? 'enabled' : 'disabled'}
          </Text>
        </Box>
        {focused && (
          <Box marginLeft={30}>
            <Text color={T.fgFaint}>Space로 토글</Text>
          </Box>
        )}
      </Box>
    );
  }

  if (field.type === 'select') {
    return (
      <Box flexDirection="column" marginBottom={0}>
        <Box gap={1}>
          <Text color={focused ? accent : T.fgDim} bold={focused}>
            {labelText}
          </Text>
          <Box
            borderStyle="single"
            borderColor={focused ? accent : T.border}
            paddingX={1}
          >
            <Text color={T.fg}>{String(value)}</Text>
            <Text color={T.fgFaint}> ▼</Text>
          </Box>
        </Box>
        {focused && (
          <Box marginLeft={30}>
            <Text color={T.fgFaint}>
              Space로 다음 옵션 ({field.options?.join(' · ')})
            </Text>
          </Box>
        )}
      </Box>
    );
  }

  // text / path
  const borderColor = error ? T.red : (focused ? accent : T.border);
  const valStr = String(value ?? '');
  const isPath = !!field.pathType;
  const cursorIndex = Math.max(0, Math.min(cursor ?? valStr.length, valStr.length));
  const beforeCursor = valStr.slice(0, cursorIndex);
  const cursorChar = valStr[cursorIndex];
  const afterCursor = valStr.slice(cursorIndex + (cursorChar ? 1 : 0));

  return (
    <Box flexDirection="column" marginBottom={0}>
      <Box gap={1}>
        <Text color={focused ? accent : T.fgDim} bold={focused}>
          {labelText}
        </Text>
        {field.required && <Text color={T.amber}>*</Text>}
        <Box
          borderStyle="single"
          borderColor={borderColor}
          paddingX={1}
          flexGrow={1}
        >
          {field.prefix && <Text color={T.fgFaint}>{field.prefix} </Text>}
          {valStr && focused ? (
            <>
              <Text color={T.fg}>{beforeCursor}</Text>
              <Text backgroundColor={accent} color={T.bg}>{cursorChar || ' '}</Text>
              <Text color={T.fg}>{afterCursor}</Text>
            </>
          ) : valStr ? (
            <Text color={T.fg}>{valStr}</Text>
          ) : (
            <Text color={T.fgFaint}>{field.hint ?? ''}</Text>
          )}
          {focused && !valStr && <Text backgroundColor={accent} color={T.bg}> </Text>}
        </Box>
      </Box>
      {focused && (
        <Box marginLeft={30}>
          {error ? (
            <Text color={T.red}>{error}</Text>
          ) : isPath ? (
            <Text color={T.fgFaint}>
              ←/→ 커서 이동 · <Text color={T.amber}>↵</Text> {field.pathType === 'file' ? '파일' : '디렉토리'} 선택창 열기
              {field.hint ? ` · ${field.hint}` : ''}
            </Text>
          ) : field.hint ? (
            <Text color={T.fgFaint}>←/→ 커서 이동 · {field.hint}</Text>
          ) : null}
        </Box>
      )}
    </Box>
  );
}
