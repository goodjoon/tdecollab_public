# 빠른 시작 가이드 (Quickstart)

## 1. 필수 요구사항
- Node.js 20+
- pnpm
- 사내 Confluence, JIRA, GitLab 계정 및 권한
- 로컬 환경변수(`.env`) 설정

## 2. 환경변수 설정
프로젝트 루트의 `.env` 파일에 다음 항목을 추가합니다.
```env
# Confluence, JIRA, GitLab 인증 정보는 기존 설정 유지
# ...

# Agentic Harness Backend 설정
PORT=3000
WEBHOOK_SECRET=your_gitlab_webhook_secret

# GitLab Polling 설정 (Webhook 사용 불가 시 옵션)
GITLAB_SYNC_MODE=webhook # webhook 또는 polling
GITLAB_POLLING_INTERVAL_SEC=60 # 폴링 주기 (초 단위)
```

## 3. 서브프로젝트 실행

이 프로젝트는 기존 `tdecollab` 저장소를 확장하여 웹 프론트엔드와 백엔드를 추가합니다.

### 3.1 종속성 설치
```bash
pnpm install
```

### 3.2 백엔드 및 MCP 서버 실행
```bash
# 백엔드 API 서버 (JIRA, Confluence 연동 및 Webhook 수신)
pnpm --filter backend dev

# MCP 서버 (기존 기능)
pnpm --filter mcp start
```

### 3.3 프론트엔드 실행
```bash
# 웹 UI 실행
pnpm --filter frontend dev
```
접속 URL: `http://localhost:3000` (예상)

## 4. GitLab Webhook 설정
1. 대상 GitLab 프로젝트의 `Settings > Webhooks`로 이동
2. URL: `http://<백엔드_서버_IP>/api/webhooks/gitlab`
3. Trigger: `Push events`, `Merge request events` 체크
4. Secret Token: `.env`의 `WEBHOOK_SECRET` 값과 동일하게 설정
