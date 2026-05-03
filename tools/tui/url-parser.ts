// Confluence URL → 폼 필드 자동 채우기 파서
//
// 지원 URL 형식:
// - /spaces/<SPACE>/pages/<pageId>/<title>      (modern)
// - /display/<SPACE>/<title>                    (legacy)
// - /pages/viewpage.action?pageId=<pageId>      (legacy query)
// - /pages/createpage.action?spaceKey=<SPACE>...

export interface ParsedConfluenceUrl {
  space?: string;
  pageId?: string;
  title?: string;
}

export function parseConfluenceUrl(input: string): ParsedConfluenceUrl {
  const url = input.trim();
  if (!url) return {};

  const result: ParsedConfluenceUrl = {};

  // /spaces/<SPACE>/pages/<pageId>
  const spacesMatch = url.match(/\/spaces\/([^/]+)\/pages\/(\d+)(?:\/([^?#]+))?/);
  if (spacesMatch) {
    result.space = decodeURIComponent(spacesMatch[1]);
    result.pageId = spacesMatch[2];
    if (spacesMatch[3]) {
      result.title = decodeConfluenceTitle(spacesMatch[3]);
    }
    return result;
  }

  // pageId=<id>
  const pageIdQuery = url.match(/[?&]pageId=(\d+)/);
  if (pageIdQuery) {
    result.pageId = pageIdQuery[1];
  }

  // spaceKey=<SPACE>
  const spaceQuery = url.match(/[?&]spaceKey=([^&]+)/);
  if (spaceQuery) {
    result.space = decodeURIComponent(spaceQuery[1]);
  }

  // /display/<SPACE>
  if (!result.space) {
    const displayMatch = url.match(/\/display\/([^/?#]+)/);
    if (displayMatch) result.space = decodeURIComponent(displayMatch[1]);
  }

  return result;
}

// 커맨드별로 URL 파싱 결과를 어느 필드에 채울지 결정
export function applyUrlFill(
  commandKey: string,
  parsed: ParsedConfluenceUrl,
  current: Record<string, string | boolean>,
): Record<string, string | boolean> {
  const result = { ...current };

  if (commandKey === 'confluence:page:get' || commandKey === 'confluence:page:update') {
    // 대상 페이지 본인의 URL → pageId, space 채움
    if (parsed.space) result['space'] = parsed.space;
    if (parsed.pageId) result['pageId'] = parsed.pageId;
    if (commandKey === 'confluence:page:get' && parsed.title) {
      result['output'] = buildOutputPathWithTitle(current['output'], parsed.title);
    }
  } else if (commandKey === 'confluence:page:create') {
    // 부모 페이지의 URL → parent, space 채움
    if (parsed.space) result['space'] = parsed.space;
    if (parsed.pageId) result['parent'] = parsed.pageId;
  }

  return result;
}

function decodeConfluenceTitle(value: string): string {
  return decodeURIComponent(value).replace(/\+/g, ' ');
}

function sanitizeFilename(value: string): string {
  return value.replace(/[\\/:*?"<>|]/g, '-').trim() || 'confluence-page';
}

export function buildOutputPathWithTitle(currentOutput: string | boolean | undefined, title: string): string {
  const filename = `${sanitizeFilename(title)}.md`;
  const current = typeof currentOutput === 'string' ? currentOutput.trim() : '';

  if (!current) return filename;
  if (current.endsWith('/')) return `${current}${filename}`;

  const slashIndex = current.lastIndexOf('/');
  if (slashIndex < 0) return filename;

  return `${current.slice(0, slashIndex + 1)}${filename}`;
}

// URL Quick-fill 기능을 지원하는 커맨드 여부
export function supportsUrlFill(commandKey: string): boolean {
  return [
    'confluence:page:get',
    'confluence:page:update',
    'confluence:page:create',
  ].includes(commandKey);
}

// 자동 채워질 필드 키 목록 (UI 표시용)
export function getUrlFillTargets(commandKey: string): string[] {
  if (commandKey === 'confluence:page:create') return ['space', 'parent'];
  if (commandKey === 'confluence:page:get') return ['space', 'pageId', 'output'];
  if (commandKey === 'confluence:page:update') return ['space', 'pageId'];
  return [];
}
