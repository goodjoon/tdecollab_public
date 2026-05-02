import dotenv from 'dotenv';
import path from 'path';
import os from 'os';

// 환경변수 로딩 우선순위:
//   1. 셸 환경변수 (이미 process.env 에 존재하므로 자동 우선)
//   2. 현재 작업 디렉토리의 tdecollab.env
//   3. ~/.config/tdecollab/.env (사용자 글로벌 설정)
//
// dotenv 기본 동작이 override: false 이므로,
// 이미 process.env 에 있는 키는 덮어쓰지 않는다.
// 따라서 우선순위 높은 출처(env vars)부터 로드하면 자연스럽게 우선순위가 적용된다.

let loaded = false;

export interface LoadEnvResult {
  loadedFiles: string[];
  skippedFiles: string[];
}

function getHomeDir(): string {
  return process.env.HOME || process.env.USERPROFILE || os.homedir();
}

export function loadEnv(): LoadEnvResult {
  const result: LoadEnvResult = { loadedFiles: [], skippedFiles: [] };
  if (loaded) return result;
  loaded = true;

  const candidates = [
    // 우선순위 2: 현재 디렉토리
    path.resolve(process.cwd(), 'tdecollab.env'),
    // 우선순위 3: 사용자 글로벌
    path.join(getHomeDir(), '.config', 'tdecollab', '.env'),
  ];

  for (const filepath of candidates) {
    const out = dotenv.config({ path: filepath, override: false });
    if (out.error) {
      // 파일이 없으면 자연스럽게 skip (오류로 취급하지 않음)
      result.skippedFiles.push(filepath);
    } else {
      result.loadedFiles.push(filepath);
    }
  }

  return result;
}

// 디버그용 — 어떤 파일이 로드되었는지 확인할 때 사용
export function getEnvLoadDebug(): string[] {
  return loaded ? ['env-loader: 1회 호출됨'] : ['env-loader: 호출되지 않음'];
}
