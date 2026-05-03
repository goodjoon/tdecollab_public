export interface TextEditState {
  value: string;
  cursor: number;
}

export type TextEditAction =
  | { type: 'insert'; text: string }
  | { type: 'backspace' }
  | { type: 'delete' }
  | { type: 'moveLeft' }
  | { type: 'moveRight' }
  | { type: 'moveHome' }
  | { type: 'moveEnd' };

export function clampCursor(cursor: number, value: string): number {
  return Math.max(0, Math.min(cursor, value.length));
}

export function applyTextEdit(state: TextEditState, action: TextEditAction): TextEditState {
  const cursor = clampCursor(state.cursor, state.value);

  if (action.type === 'moveLeft') {
    return { value: state.value, cursor: clampCursor(cursor - 1, state.value) };
  }

  if (action.type === 'moveRight') {
    return { value: state.value, cursor: clampCursor(cursor + 1, state.value) };
  }

  if (action.type === 'moveHome') {
    return { value: state.value, cursor: 0 };
  }

  if (action.type === 'moveEnd') {
    return { value: state.value, cursor: state.value.length };
  }

  if (action.type === 'insert') {
    const value = `${state.value.slice(0, cursor)}${action.text}${state.value.slice(cursor)}`;
    return { value, cursor: cursor + action.text.length };
  }

  if (action.type === 'backspace') {
    if (cursor === 0) return { value: state.value, cursor };
    const value = `${state.value.slice(0, cursor - 1)}${state.value.slice(cursor)}`;
    return { value, cursor: cursor - 1 };
  }

  if (action.type === 'delete') {
    if (cursor >= state.value.length) return { value: state.value, cursor };
    const value = `${state.value.slice(0, cursor)}${state.value.slice(cursor + 1)}`;
    return { value, cursor };
  }

  return { value: state.value, cursor };
}
