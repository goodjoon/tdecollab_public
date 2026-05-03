import { getEnvSource, loadEnv } from './env-loader.js';

const DIAGNOSTIC_KEYS = [
  'CONFLUENCE_BASE_URL',
  'CONFLUENCE_AUTH_TYPE',
  'CONFLUENCE_USERNAME',
  'CONFLUENCE_API_TOKEN',
  'JIRA_BASE_URL',
  'JIRA_USERNAME',
  'JIRA_API_TOKEN',
  'GITLAB_BASE_URL',
  'GITLAB_PRIVATE_TOKEN',
  'AI_PROVIDER',
  'AI_MODEL',
  'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY',
];

function maskValue(key: string, value: string | undefined): string {
  if (!value) return '<unset>';

  if (key.includes('TOKEN') || key.includes('KEY')) {
    if (value.length <= 8) return `<set len=${value.length}>`;
    return `${value.slice(0, 4)}...${value.slice(-4)} len=${value.length}`;
  }

  return value;
}

function formatSource(source: string): string {
  if (source === '<unset>') return source;
  if (source === 'shell env') return source;
  return source.replace(process.cwd(), '.');
}

export function getRuntimeConfigDiagnostics(): string[] {
  const env = loadEnv();
  const authType = (process.env.CONFLUENCE_AUTH_TYPE || 'bearer').toLowerCase();
  const authMode = authType === 'basic' ? 'Basic' : 'Bearer';

  return [
    '설정 로딩 진단',
    `- loaded files: ${env.loadedFiles.map(formatSource).join(', ') || '<none>'}`,
    `- skipped files: ${env.skippedFiles.map(formatSource).join(', ') || '<none>'}`,
    `- confluence auth mode: ${authMode}`,
    ...DIAGNOSTIC_KEYS.map((key) => {
      const value = maskValue(key, process.env[key]);
      const source = formatSource(getEnvSource(key));
      return `- ${key}=${value} (${source})`;
    }),
  ];
}

export function formatRuntimeConfigDiagnostics(): string {
  return getRuntimeConfigDiagnostics().join('\n');
}
