import { describe, it, expect } from 'vitest';
import { extractFrontmatter, updateOrInsertFrontmatter } from '../src/utils/frontmatter.js';

describe('Frontmatter Utils', () => {
  it('extracts confluence_page_id from frontmatter', () => {
    const content = `---\nconfluence_page_id: 12345\n---\n# Title`;
    expect(extractFrontmatter(content)?.confluence_page_id).toBe('12345');
  });

  it('inserts confluence_page_id if missing', () => {
    const content = `# Title\nBody`;
    const updated = updateOrInsertFrontmatter(content, 'confluence_page_id', '67890');
    expect(updated).toContain('confluence_page_id: 67890');
    expect(updated).toContain('# Title');
  });
});
