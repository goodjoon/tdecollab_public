export function extractFrontmatter(content: string): Record<string, any> | null {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  
  const frontmatter: Record<string, string> = {};
  const lines = match[1].split('\n');
  for (const line of lines) {
    const [key, ...values] = line.split(':');
    if (key && values.length > 0) {
      frontmatter[key.trim()] = values.join(':').trim();
    }
  }
  return frontmatter;
}

export function updateOrInsertFrontmatter(content: string, key: string, value: string): string {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  
  if (match) {
    const lines = match[1].split('\n');
    let found = false;
    const newLines = lines.map(line => {
      if (line.startsWith(`${key}:`)) {
        found = true;
        return `${key}: ${value}`;
      }
      return line;
    });
    
    if (!found) {
      newLines.push(`${key}: ${value}`);
    }
    
    return content.replace(match[0], `---\n${newLines.join('\n')}\n---`);
  } else {
    return `---\n${key}: ${value}\n---\n\n${content}`;
  }
}