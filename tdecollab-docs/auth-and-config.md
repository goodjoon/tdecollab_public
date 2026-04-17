# 인증 및 설정 관리

## 1. 환경변수 체계

### 1.1 네이밍 규칙
환경변수는 서비스별로 접두사를 사용하여 구분한다.

| 접두사 | 서비스 |
|--------|--------|
| `CONFLUENCE_` | Confluence |
| `JIRA_` | JIRA |
| `GITLAB_` | GitLab |

### 1.2 전체 환경변수 목록

**Confluence:**
| 변수명 | 필수 | 설명 | 예시 |
|--------|------|------|------|
| `CONFLUENCE_BASE_URL` | O | Confluence 서버 URL | `https://confluence.tde.sktelecom.com` |
| `CONFLUENCE_EMAIL` | O | 사용자 이메일 | `사번@sktelecom.com` |
| `CONFLUENCE_API_TOKEN` | △ | API 토큰 (PASSWORD와 택1) | |
| `CONFLUENCE_PASSWORD` | △ | 비밀번호 (API_TOKEN과 택1) | |
| `CONFLUENCE_SPACE_KEY` | | 기본 스페이스 키 | `~사용자스페이스` |
| `CONFLUENCE_PARENT_PAGE_ID` | | 기본 상위 페이지 ID | `12345678` |

**JIRA:**
| 변수명 | 필수 | 설명 | 예시 |
|--------|------|------|------|
| `JIRA_BASE_URL` | O | JIRA 서버 URL | `https://jira.tde.sktelecom.com` |
| `JIRA_EMAIL` | O | 사용자 이메일 | `사번@sktelecom.com` |
| `JIRA_API_TOKEN` | △ | API 토큰 (PASSWORD와 택1) | |
| `JIRA_PASSWORD` | △ | 비밀번호 (API_TOKEN과 택1) | |

**GitLab:**
| 변수명 | 필수 | 설명 | 예시 |
|--------|------|------|------|
| `GITLAB_BASE_URL` | O | GitLab 서버 URL | `https://gitlab.tde.sktelecom.com` |
| `GITLAB_PRIVATE_TOKEN` | O | Personal Access Token | |

### 1.3 .env 파일 구조
프로젝트 루트의 `.env` 파일에 모든 서비스의 환경변수를 통합 관리한다. `.env.example`을 복사하여 사용.

## 2. Confluence 인증

### 2.1 인증 방식
TDE Confluence는 Server/Data Center 버전으로, HTTP Basic Auth를 사용한다.

**방식 A: Email + API Token (권장)**
```
Authorization: Basic base64(email:api-token)
```

**방식 B: Email + Password (대체)**
```
Authorization: Basic base64(email:password)
```

### 2.2 인증 우선순위
1. `CONFLUENCE_API_TOKEN`이 설정되어 있으면 Email + Token 조합 사용
2. Token이 없고 `CONFLUENCE_PASSWORD`가 설정되어 있으면 Email + Password 조합 사용
3. 둘 다 없으면 에러 발생

### 2.3 Base URL
- 서버 URL: `https://confluence.tde.sktelecom.com`
- API 경로 접두사: `/rest/api`
- 사용자가 전체 페이지 URL을 입력해도 base URL을 자동 추출하는 로직 필요 (aicc-pm의 `_sanitize_base_url` 참조)

## 3. JIRA 인증

### 3.1 인증 방식
TDE JIRA도 Server/Data Center 버전으로, Confluence와 동일한 HTTP Basic Auth 사용.

**방식 A: Email + API Token (권장)**
```
Authorization: Basic base64(email:api-token)
```

**방식 B: Email + Password (대체)**
```
Authorization: Basic base64(email:password)
```

### 3.2 인증 우선순위
Confluence와 동일한 규칙 적용.

### 3.3 Base URL
- 서버 URL: `https://jira.tde.sktelecom.com`
- REST API 접두사: `/rest/api/2`
- Agile API 접두사: `/rest/agile/1.0`

## 4. GitLab 인증

### 4.1 인증 방식
TDE GitLab은 Self-hosted 버전으로, Personal Access Token을 HTTP 헤더로 전달한다.

```
PRIVATE-TOKEN: <personal-access-token>
```

### 4.2 토큰 생성
GitLab 웹 UI → Settings → Access Tokens에서 생성. 필요한 스코프:
- `api`: 전체 API 접근
- `read_api`: 읽기 전용 (조회만 필요한 경우)
- `read_repository`: 저장소 파일 조회

### 4.3 Base URL
- 서버 URL: `https://gitlab.tde.sktelecom.com`
- API 접두사: `/api/v4`

## 5. 설정 관리 클래스 설계

### 5.1 ConfigManager 인터페이스
```typescript
interface ServiceConfig {
  baseUrl: string;
  // 서비스별 추가 필드
}

interface ConfluenceConfig extends ServiceConfig {
  email: string;
  apiToken?: string;
  password?: string;
  defaultSpaceKey?: string;
  defaultParentPageId?: string;
}

interface JiraConfig extends ServiceConfig {
  email: string;
  apiToken?: string;
  password?: string;
}

interface GitlabConfig extends ServiceConfig {
  privateToken: string;
}
```

### 5.2 환경변수 유효성 검증
- 각 서비스를 사용할 때 해당 서비스의 필수 환경변수가 설정되어 있는지 검증
- 누락된 환경변수에 대해 구체적인 에러 메시지 제공
- 모든 서비스가 동시에 설정되어 있을 필요는 없음 (사용하는 서비스만 설정)

### 5.3 기본값 처리
- `CONFLUENCE_SPACE_KEY`: 미설정 시 CLI에서 매번 입력 요구
- `CONFLUENCE_PARENT_PAGE_ID`: 미설정 시 스페이스 루트에 생성
- 타임아웃: 기본 30초 (환경변수로 오버라이드 가능)

## 6. 보안 고려사항

### 6.1 .env 파일 보호
- `.gitignore`에 `.env` 포함 (이미 설정됨)
- `.env.example`에는 실제 값 대신 플레이스홀더 사용

### 6.2 토큰 로그 마스킹
- 로그 출력 시 API 토큰, 비밀번호 등 민감 정보는 마스킹 처리
- 예: `api-token → api-t****`
- HTTP 요청 디버그 로그에서 Authorization 헤더 마스킹

### 6.3 민감 정보 노출 방지
- 에러 메시지에 토큰이나 비밀번호가 포함되지 않도록 처리
- MCP 응답에 인증 정보가 포함되지 않도록 필터링
