import { describe, expect, it } from 'vitest';
import { applyTextEdit, clampCursor } from '../../tools/tui/text-edit.js';

describe('TUI text editing utilities', () => {
  it('커서를 좌우로 이동하고 현재 위치에 문자를 삽입한다', () => {
    let state = { value: 'files/download/lucian.md', cursor: 'files/download/lucian.md'.length };

    state = applyTextEdit(state, { type: 'moveLeft' });
    state = applyTextEdit(state, { type: 'moveLeft' });
    state = applyTextEdit(state, { type: 'insert', text: '01' });

    expect(state.value).toBe('files/download/lucian.01md');
    expect(state.cursor).toBe('files/download/lucian.01'.length);
  });

  it('backspace는 커서 앞 문자를 지우고 delete는 커서 위치 문자를 지운다', () => {
    let state = { value: 'PAGE_TEST_002.md', cursor: 9 };

    state = applyTextEdit(state, { type: 'backspace' });
    expect(state).toEqual({ value: 'PAGE_TES_002.md', cursor: 8 });

    state = applyTextEdit(state, { type: 'delete' });
    expect(state).toEqual({ value: 'PAGE_TES002.md', cursor: 8 });
  });

  it('커서 위치를 문자열 범위 안으로 제한한다', () => {
    expect(clampCursor(-10, 'abc')).toBe(0);
    expect(clampCursor(10, 'abc')).toBe(3);
  });
});
