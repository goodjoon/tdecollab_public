export class StorageToMarkdownConverter {
    convert(storageHtml: string, imageUrlMap?: Map<string, string>): string {
        // Simple implementation for now.
        // In a real scenario, we would use a proper HTML parser like cheerio or jsdom, 
        // or TurndownService.
        // For this phase, let's do basic replacements to demonstrate structure.

        let md = storageHtml;

        // Remove storage specific wrapper if any (usually not needed if just fragment)

        // 이미지 변환 (imageUrlMap이 제공된 경우 로컬 경로로 변환)
        if (imageUrlMap && imageUrlMap.size > 0) {
            imageUrlMap.forEach((localPath, originalTag) => {
                // 파일명에서 alt text 생성
                const filename = localPath.split('/').pop() || 'image';
                const altText = filename.replace(/\.[^.]+$/, ''); // 확장자 제거
                const markdownImage = `![${altText}](${localPath})`;
                md = md.replace(originalTag, markdownImage);
            });
        }

        // 남은 이미지 태그 처리 (다운로드하지 않은 경우)
        // ac:image with attachment
        md = md.replace(
            /<ac:image[^>]*>[\s\S]*?<ri:attachment\s+ri:filename="([^"]+)"[\s\S]*?<\/ac:image>/g,
            (match, filename) => {
                return `![${filename}](attachment:${filename})`;
            }
        );

        // ac:image with URL
        md = md.replace(
            /<ac:image[^>]*>[\s\S]*?<ri:url\s+ri:value="([^"]+)"[\s\S]*?<\/ac:image>/g,
            (match, url) => {
                const filename = url.split('/').pop() || 'image';
                return `![${filename}](${url})`;
            }
        );

        // 일반 img 태그
        md = md.replace(
            /<img\s+[^>]*src="([^"]+)"[^>]*(?:alt="([^"]*)")?[^>]*\/?>/g,
            (match, src, alt) => {
                const altText = alt || src.split('/').pop() || 'image';
                return `![${altText}](${src})`;
            }
        );

        // Code Macro -> Markdown Code Block
        // Structure: <ac:structured-macro ac:name="code">...<ac:parameter ac:name="language">lang</ac:parameter>...<ac:plain-text-body><![CDATA[code]]></ac:plain-text-body></ac:structured-macro>

        // Regex based parsing is fragile but sufficient for controlled inputs/MVP.
        // 1. Extract Code Blocks
        md = md.replace(/<ac:structured-macro[^>]*ac:name="code"[^>]*>[\s\S]*?<ac:parameter[^>]*ac:name="language">([^<]*)<\/ac:parameter>[\s\S]*?<ac:plain-text-body><!\[CDATA\[([\s\S]*?)\]\]><\/ac:plain-text-body>[\s\S]*?<\/ac:structured-macro>/g, (match, lang, code) => {
            return `\`\`\`${lang}\n${code}\n\`\`\``;
        });

        // Fallback for code macro without language param (if possible) - simplifying regex for now.

        // Basic HTML to MD mapping
        md = md.replace(/<h1>(.*?)<\/h1>/g, '# $1\n');
        md = md.replace(/<h2>(.*?)<\/h2>/g, '## $1\n');
        md = md.replace(/<h3>(.*?)<\/h3>/g, '### $1\n');
        md = md.replace(/<p>(.*?)<\/p>/g, '$1\n\n');
        md = md.replace(/<strong>(.*?)<\/strong>/g, '**$1**');
        md = md.replace(/<b>(.*?)<\/b>/g, '**$1**');
        md = md.replace(/<em>(.*?)<\/em>/g, '*$1*');
        md = md.replace(/<i>(.*?)<\/i>/g, '*$1*');

        // Lists
        md = md.replace(/<ul>([\s\S]*?)<\/ul>/g, (match, content) => {
            return content.replace(/<li>(.*?)<\/li>/g, '- $1\n');
        });
        md = md.replace(/<ol>([\s\S]*?)<\/ol>/g, (match, content) => {
            let i = 1;
            return content.replace(/<li>(.*?)<\/li>/g, () => `${i++}. $1\n`);
        });

        // Decode HTML entities (basic ones)
        md = md.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"');

        return md.trim();
    }
}
