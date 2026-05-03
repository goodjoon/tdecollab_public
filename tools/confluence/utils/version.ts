export function resolveCurrentVersionForUpdate(version: number | null | undefined): number {
    return version ?? 1;
}
