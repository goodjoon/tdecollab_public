// 디자인 시스템 색상 토큰 — k9s/charm.sh 분위기의 다크 모던 TUI
export const T = {
  bg:        '#08090C',
  termBg:    '#0E1014',
  panelBg:   '#13161C',
  panelHi:   '#181C24',
  border:    '#2A2F3A',
  borderDim: '#1E222B',
  borderHi:  '#3D4452',

  fg:        '#E6E8EC',
  fgDim:     '#9CA3AF',
  fgMute:    '#6B7280',
  fgFaint:   '#4B5563',

  pink:      '#FF7BAC',
  cyan:      '#7DD3FC',
  mint:      '#86EFAC',
  amber:     '#FBBF24',
  violet:    '#C4B5FD',
  red:       '#F87171',
  blue:      '#60A5FA',
};

// 서비스별 브랜드 색상 (히스토리 svc 코드 포함)
export const SVC_COLOR: Record<string, string> = {
  confluence: T.cyan,
  jira:       T.mint,
  gitlab:     T.amber,
  cf:         T.cyan,
  jr:         T.mint,
  gl:         T.amber,
};

// 기본 accent 색상
export const DEFAULT_ACCENT = T.pink;
