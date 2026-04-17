import { MarkdownToStorageConverter } from './src/confluence/converters/md-to-storage.js';

const converter = new MarkdownToStorageConverter();

const md = `
\`\`\`mermaid
sequenceDiagram
    A->>B: hello
\`\`\`

\`\`\`plantuml
@startuml
A -> B: hello
@enduml
\`\`\`

\`\`\`json
{ "key": "value" }
\`\`\`
`;

const result = converter.convert(md);
console.log(result);
