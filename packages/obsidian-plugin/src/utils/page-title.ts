export interface PageTitleLookupApi {
  getPageByTitle(
    spaceKey: string,
    title: string,
    expand?: string[],
  ): Promise<{ id?: string; title?: string } | null>;
}

export class DuplicatePageTitleError extends Error {
  constructor(
    public readonly title: string,
    public readonly spaceKey: string,
  ) {
    super(buildDuplicatePageTitleMessage(title, spaceKey));
    this.name = 'DuplicatePageTitleError';
  }
}

export function buildDuplicatePageTitleMessage(title: string, spaceKey: string): string {
  return `이미 '${title}' 페이지가 '${spaceKey}' Space에 존재합니다. Obsidian 파일 이름을 바꾼 뒤 다시 업로드하세요.`;
}

export function isDuplicatePageTitleApiError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const statusCode = 'statusCode' in error ? Number((error as { statusCode?: unknown }).statusCode) : undefined;
  const message = 'message' in error ? String((error as { message?: unknown }).message) : '';

  return (
    statusCode === 400 &&
    message.includes('A page with this title already exists') &&
    message.includes('A page already exists with the title')
  );
}

export async function assertNewPageTitleAvailable(
  api: PageTitleLookupApi,
  spaceKey: string,
  title: string,
): Promise<void> {
  const existingPage = await api.getPageByTitle(spaceKey, title, ['version', 'space']);

  if (existingPage) {
    throw new DuplicatePageTitleError(title, spaceKey);
  }
}
