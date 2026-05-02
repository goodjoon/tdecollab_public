# Confluence REST API 스펙

## 1. 기본 정보
- Base URL: `https://confluence.tde.example.com`
- API 경로 접두사: `/rest/api`
- 인증: HTTP Basic Auth (Email:API-Token 또는 Email:Password)
- 서버 유형: Confluence Server/Data Center (Cloud가 아님)
- 응답 형식: JSON
- 요청 인코딩: UTF-8

## 2. 콘텐츠(페이지) API

### 2.1 페이지 목록 조회
- **메서드**: `GET /rest/api/content`
- **파라미터**:
  | 파라미터 | 타입 | 필수 | 설명 |
  |----------|------|------|------|
  | `spaceKey` | string | | 스페이스 키 필터 |
  | `title` | string | | 페이지 제목 (정확한 일치) |
  | `type` | string | | 콘텐츠 타입 (`page`, `blogpost`) |
  | `status` | string | | 상태 (`current`, `trashed`) |
  | `expand` | string | | 확장 필드 (쉼표 구분) |
  | `start` | number | | 시작 인덱스 (페이지네이션) |
  | `limit` | number | | 반환 수 제한 (기본: 25, 최대: 200) |
- **응답 예시**:
```json
{
  "results": [
    {
      "id": "12345",
      "type": "page",
      "status": "current",
      "title": "페이지 제목",
      "space": { "key": "SPACE", "name": "스페이스 이름" },
      "_links": { "webui": "/pages/viewpage.action?pageId=12345" }
    }
  ],
  "start": 0,
  "limit": 25,
  "size": 1,
  "_links": { "next": "/rest/api/content?start=25&limit=25" }
}
```

### 2.2 페이지 상세 조회
- **메서드**: `GET /rest/api/content/{id}`
- **경로 파라미터**: `id` - 페이지 ID
- **쿼리 파라미터**:
  | 파라미터 | 타입 | 설명 |
  |----------|------|------|
  | `expand` | string | `body.storage`, `body.view`, `version`, `space`, `ancestors`, `children.page` |
- **주요 expand 옵션**:
  - `body.storage`: Confluence Storage 형식 본문 (XML/HTML)
  - `body.view`: 렌더링된 HTML 본문
  - `version`: 버전 정보 (수정 시 필요)
  - `ancestors`: 상위 페이지 계층
  - `children.page`: 직접 자식 페이지

### 2.3 페이지 생성
- **메서드**: `POST /rest/api/content`
- **Content-Type**: `application/json`
- **요청 본문**:
```json
{
  "type": "page",
  "title": "새 페이지 제목",
  "space": { "key": "SPACE" },
  "ancestors": [{ "id": "부모페이지ID" }],
  "body": {
    "storage": {
      "value": "<p>Confluence Storage HTML 본문</p>",
      "representation": "storage"
    }
  }
}
```
- **응답**: 생성된 페이지 객체 (201 Created)
- **참고**: `ancestors`가 없으면 스페이스 루트에 생성

### 2.4 페이지 수정
- **메서드**: `PUT /rest/api/content/{id}`
- **요청 본문**:
```json
{
  "id": "12345",
  "type": "page",
  "title": "수정된 제목",
  "version": { "number": 3 },
  "body": {
    "storage": {
      "value": "<p>수정된 본문</p>",
      "representation": "storage"
    }
  }
}
```
- **주의사항**:
  - `version.number`는 현재 버전 + 1 이어야 함
  - 버전 번호가 맞지 않으면 409 Conflict 발생
  - 수정 전 반드시 현재 페이지를 조회하여 버전 번호 확인

### 2.5 페이지 삭제
- **메서드**: `DELETE /rest/api/content/{id}`
- **응답**: 204 No Content
- **참고**: 삭제된 페이지는 휴지통으로 이동

## 3. 자식 콘텐츠 API

### 3.1 직접 자식 페이지 조회
- **메서드**: `GET /rest/api/content/{id}/child/page`
- **파라미터**: `expand`, `start`, `limit`
- **주의**: Server 버전은 직접 자식만 지원. `descendant/page`는 미구현이므로, 전체 트리 조회 시 재귀 호출 필요

### 3.2 첨부파일 조회
- **메서드**: `GET /rest/api/content/{id}/child/attachment`

## 4. 스페이스 API

### 4.1 스페이스 목록 조회
- **메서드**: `GET /rest/api/space`
- **파라미터**:
  | 파라미터 | 타입 | 설명 |
  |----------|------|------|
  | `spaceKey` | string | 특정 스페이스 키 |
  | `type` | string | `global`, `personal` |
  | `start` | number | 시작 인덱스 |
  | `limit` | number | 반환 수 제한 |
  | `expand` | string | `description`, `homepage` |

### 4.2 스페이스 상세 조회
- **메서드**: `GET /rest/api/space/{spaceKey}`
- **expand**: `description`, `homepage`, `metadata`

### 4.3 스페이스 내 콘텐츠 조회
- **메서드**: `GET /rest/api/space/{spaceKey}/content`
- **메서드**: `GET /rest/api/space/{spaceKey}/content/{type}`

## 5. 검색 API

### 5.1 CQL 검색
- **메서드**: `GET /rest/api/content/search`
- **파라미터**:
  | 파라미터 | 타입 | 설명 |
  |----------|------|------|
  | `cql` | string | CQL 쿼리 문자열 |
  | `cqlcontext` | string | CQL 컨텍스트 |
  | `start` | number | 시작 인덱스 |
  | `limit` | number | 반환 수 제한 |
  | `expand` | string | 확장 필드 |
- **CQL 예시**:
  - `type=page AND space=MYSPACE AND title~"검색어"`
  - `type=page AND label="my-label"`
  - `type=page AND text~"본문검색"`

## 6. 라벨 API

### 6.1 라벨 조회
- **메서드**: `GET /rest/api/content/{id}/label`
- **응답**: 라벨 배열 `[{ prefix: "global", name: "라벨명", id: "123" }]`

### 6.2 라벨 추가
- **메서드**: `POST /rest/api/content/{id}/label`
- **요청 본문**: `[{ "prefix": "global", "name": "라벨명" }]`
- **참고**: 복수 라벨 동시 추가 가능

### 6.3 라벨 삭제
- **메서드**: `DELETE /rest/api/content/{id}/label/{labelName}`

## 7. 콘텐츠 변환 API

### 7.1 저장 형식 변환
- **메서드**: `POST /rest/api/contentbody/convert/{to}`
- **경로 파라미터**: `to` - 변환 대상 형식 (`storage`, `view`, `editor`)
- **요청 본문**: `{ "value": "원본 콘텐츠", "representation": "wiki|storage|editor" }`

## 8. 사용자 API

### 8.1 현재 사용자 조회
- **메서드**: `GET /rest/api/user/current`
- **용도**: 인증 확인, 사용자 정보 조회

## 9. 응답 형식 및 에러 코드

| 상태 코드 | 설명 |
|-----------|------|
| 200 | 조회/수정 성공 |
| 201 | 생성 성공 |
| 204 | 삭제 성공 |
| 400 | 잘못된 요청 (파라미터 오류) |
| 401 | 인증 실패 (이메일/토큰 확인) |
| 403 | 권한 없음 (스페이스/페이지 접근 권한) |
| 404 | 리소스 없음 (페이지/스페이스 미존재) |
| 409 | 버전 충돌 (동시 수정) |
| 500 | 서버 내부 오류 |

### 페이지네이션 응답 구조
```json
{
  "results": [...],
  "start": 0,
  "limit": 25,
  "size": 10,
  "_links": {
    "next": "/rest/api/content?start=25&limit=25",
    "base": "https://confluence.tde.example.com",
    "context": "/rest/api"
  }
}
```
