export interface ParsedParentPageUrl {
  spaceKey?: string;
  parentId?: string;
}

export function parseParentPageUrl(input: string): ParsedParentPageUrl {
  const value = input.trim();
  if (!value || !value.includes('/')) {
    return {};
  }

  const parsed: ParsedParentPageUrl = {};

  const modernMatch = value.match(/\/spaces\/([^/?#]+)\/pages\/(\d+)/);
  if (modernMatch) {
    parsed.spaceKey = decodeURIComponent(modernMatch[1]);
    parsed.parentId = modernMatch[2];
    return parsed;
  }

  const pageIdMatch = value.match(/[?&]pageId=(\d+)/);
  if (pageIdMatch) {
    parsed.parentId = pageIdMatch[1];
  }

  const spaceKeyMatch = value.match(/[?&]spaceKey=([^&#]+)/);
  if (spaceKeyMatch) {
    parsed.spaceKey = decodeURIComponent(spaceKeyMatch[1]);
  }

  const displayMatch = value.match(/\/display\/([^/?#]+)/);
  if (!parsed.spaceKey && displayMatch) {
    parsed.spaceKey = decodeURIComponent(displayMatch[1]);
  }

  return parsed;
}
