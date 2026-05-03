export function normalizeConfluencePageId(input: string): string {
    const value = input.trim();

    const modernUrlMatch = value.match(/\/pages\/(\d+)(?:\/|$)/);
    if (modernUrlMatch) {
        return modernUrlMatch[1];
    }

    const queryUrlMatch = value.match(/[?&]pageId=(\d+)/);
    if (queryUrlMatch) {
        return queryUrlMatch[1];
    }

    return value;
}
