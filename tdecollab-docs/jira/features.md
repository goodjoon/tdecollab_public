# JIRA 기능 정의

## 1. 이슈 CRUD

### 1.1 이슈 조회
- 이슈 키(PROJ-123) 또는 숫자 ID로 상세 조회
- 반환 정보: 요약, 상태, 담당자, 보고자, 우선순위, 이슈 타입, 설명, 라벨, 컴포넌트
- 관련 이슈(링크), 서브태스크 포함 조회 옵션
- 커스텀 필드 조회 지원

### 1.2 이슈 생성
- 필수 입력: 프로젝트 키, 이슈 타입, 요약(제목)
- 선택 입력: 설명, 담당자, 우선순위, 라벨, 컴포넌트, 상위 이슈(서브태스크용)
- 서브태스크 생성 지원 (상위 이슈 지정)
- 생성 후 이슈 키 및 URL 반환

### 1.3 이슈 수정
- 필드 직접 업데이트 (fields 방식): summary, description, assignee, priority 등
- 연산 기반 업데이트 (update 방식): add, remove, set 연산
  - 라벨: 개별 추가/삭제
  - 컴포넌트: 개별 추가/삭제

## 2. 이슈 검색 (JQL)
- JQL(JIRA Query Language) 쿼리 문자열 지원
- 자주 사용하는 검색 패턴:
  - 내 이슈: `assignee = currentUser()`
  - 프로젝트별: `project = PROJ`
  - 상태별: `status = "진행 중"`
  - 최근 업데이트: `updated >= -7d`
  - 스프린트: `sprint in openSprints()`
- 결과 필드 선택 반환 (불필요한 필드 제외로 성능 최적화)
- 페이지네이션 지원

## 3. 이슈 상태 변경 (트랜지션)
- 현재 이슈에서 가능한 트랜지션 목록 조회
- 트랜지션 실행 (ID 또는 이름으로 지정)
- 트랜지션 시 필수 필드 자동 확인 (예: 완료 시 해결 사유)
- 주요 트랜지션 예: 할 일 → 진행 중, 진행 중 → 리뷰, 리뷰 → 완료

## 4. 코멘트 관리
- 이슈의 코멘트 목록 조회 (시간순)
- 코멘트 추가
- 코멘트 수정 (본인 코멘트만)
- 코멘트 삭제 (본인 코멘트만)

## 5. 프로젝트/보드 조회
- 접근 가능한 프로젝트 목록
- 프로젝트 상세 (이름, 키, 리드, 이슈 타입 목록)
- Agile 보드 목록 (Scrum/Kanban 필터)
- 보드의 현재 스프린트 정보

## 6. CLI 커맨드 구조

```bash
# 이슈 조회
tdecollab jira issue get <issueKey> [--fields <f1,f2>]

# 이슈 생성
tdecollab jira issue create --project <key> --type <type> --summary <text> [--description <text>] [--assignee <user>] [--priority <priority>] [--labels <l1,l2>]

# 이슈 수정
tdecollab jira issue update <issueKey> [--summary <text>] [--description <text>] [--assignee <user>]

# 이슈 상태 변경
tdecollab jira issue transition <issueKey> --to <statusName>
tdecollab jira issue transitions <issueKey>    # 가능한 트랜지션 목록

# 검색
tdecollab jira search <jql> [--max <n>] [--fields <f1,f2>]

# 코멘트
tdecollab jira comment list <issueKey>
tdecollab jira comment add <issueKey> --body <text>
tdecollab jira comment update <issueKey> <commentId> --body <text>
tdecollab jira comment delete <issueKey> <commentId>

# 프로젝트
tdecollab jira project list
tdecollab jira project get <projectKey>

# 보드
tdecollab jira board list [--project <key>] [--type scrum|kanban]
tdecollab jira board sprints <boardId> [--state active|future|closed]
```
