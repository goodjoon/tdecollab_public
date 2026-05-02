import { JiraIssueApi } from '../../jira/api/issue.js';
import { createJiraClient } from '../../jira/api/client.js';
import { loadJiraConfig } from '../../common/config.js';
import type { JiraIssueInfo } from './storage-to-md.js';

/**
 * Confluence Storage XML에서 JIRA 매크로의 key 파라미터를 추출한다.
 * 중복 키는 제거하여 반환한다.
 */
export function extractJiraKeys(storageXml: string): string[] {
    const keys = new Set<string>();
    const macroRegex = /<ac:structured-macro\s+ac:name="jira"[\s\S]*?<\/ac:structured-macro>/gi;
    const keyRegex = /<ac:parameter\s+ac:name="key">([^<]+)<\/ac:parameter>/i;
    let match;
    while ((match = macroRegex.exec(storageXml)) !== null) {
        const keyMatch = keyRegex.exec(match[0]);
        if (keyMatch) keys.add(keyMatch[1].trim());
    }
    return [...keys];
}

/**
 * JIRA API에서 이슈 목록을 배치 조회하여 key → JiraIssueInfo 맵을 반환한다.
 * 개별 이슈 조회 실패 시 해당 키를 맵에서 제외한다 (링크만 표시됨).
 */
export async function buildJiraIssueMap(
    keys: string[],
    jiraApi: JiraIssueApi,
): Promise<Map<string, JiraIssueInfo>> {
    const map = new Map<string, JiraIssueInfo>();
    if (keys.length === 0) return map;

    await Promise.allSettled(
        keys.map(async (key) => {
            try {
                const issue = await jiraApi.getIssue(key, ['summary', 'status']);
                map.set(key, {
                    summary: issue.fields.summary ?? '',
                    status: issue.fields.status?.name ?? '',
                });
            } catch {
                // 조회 실패 시 해당 키 생략 — 링크만 표시
            }
        }),
    );
    return map;
}

/**
 * Storage XML에서 JIRA 키를 추출하고, JIRA 설정이 가능한 경우 이슈 정보를 가져온다.
 * JIRA 설정이 없거나 오류 발생 시 빈 맵을 반환한다 (graceful fallback).
 */
export async function tryBuildJiraIssueMap(
    storageXml: string,
): Promise<Map<string, JiraIssueInfo>> {
    try {
        const keys = extractJiraKeys(storageXml);
        if (keys.length === 0) return new Map();

        const config = loadJiraConfig();
        const client = createJiraClient(config);
        const api = new JiraIssueApi(client);
        return await buildJiraIssueMap(keys, api);
    } catch {
        return new Map();
    }
}
