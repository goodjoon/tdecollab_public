import type Token from 'markdown-it/lib/token.mjs';

function headingText(tokens: Token[]): string {
  return tokens
    .map((token) => {
      if (token.children) return headingText(token.children);
      if (token.type === 'text' || token.type === 'code_inline') return token.content;
      if (token.type === 'softbreak' || token.type === 'hardbreak') return ' ';
      return '';
    })
    .join('');
}

export function createHeadingSlugger(): (text: string) => string {
  const used = new Set<string>();
  return (text) => {
    const base = text
      .toLowerCase()
      .replace(/[^\p{L}\p{M}\p{N}_\-\s]/gu, '')
      .replace(/\s/g, '-');
    if (!base) return '';

    let slug = base;
    let suffix = 0;
    while (used.has(slug)) slug = `${base}-${++suffix}`;
    used.add(slug);
    return slug;
  };
}

/** 문서 안에서 연결되는 제목과 링크만 표시하며, 변환 간 상태를 공유하지 않는다. */
export function annotateHeadingLinks(tokens: Token[]): void {
  const headings = new Map<string, Token>();
  const titles = new Map<string, string>();
  const headingSlug = createHeadingSlugger();

  for (let index = 0; index < tokens.length; index++) {
    if (tokens[index].type !== 'heading_open') continue;
    const text = headingText(tokens[index + 1]?.children || []);
    const slug = headingSlug(text);
    if (!slug) continue;
    headings.set(slug, tokens[index]);
    if (!titles.has(text)) titles.set(text, slug);
  }

  for (const block of tokens) {
    const children = block.children || [];
    for (let index = 0; index < children.length; index++) {
      const link = children[index];
      const href = link.type === 'link_open' ? link.attrGet('href') : null;
      if (!href?.startsWith('#') || href.length === 1) continue;

      let fragment: string;
      try {
        fragment = decodeURIComponent(href.slice(1));
      } catch {
        continue;
      }
      const slug = headings.has(fragment) ? fragment : titles.get(fragment);
      if (!slug) continue;
      const close = children.slice(index + 1).find((token) => token.type === 'link_close');
      if (!close) continue;

      const heading = headings.get(slug)!;
      heading.meta = { ...heading.meta, headingAnchor: slug };
      link.meta = { ...link.meta, headingAnchor: slug };
      close.meta = { ...close.meta, headingAnchor: slug };
    }
  }
}
