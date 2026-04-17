# Confluence 기능 정의

## 1. 페이지 CRUD

### 1.1 페이지 조회
- 페이지 ID로 상세 조회 (제목, 본문, 메타데이터)
- 스페이스 + 제목으로 조회
- 본문 반환 형식 선택: Markdown (Storage→MD 변환) 또는 원본 Storage HTML
- expand 옵션으로 조회 깊이 조절 (버전, 조상, 자식 등)

### 1.2 페이지 생성
- Markdown 입력 → Confluence Storage 변환 → 페이지 생성
- 필수 입력: 스페이스 키, 페이지 제목, 본문 (파일 경로 또는 직접 입력)
- 선택 입력: 상위 페이지 ID, 라벨 목록
- 동일 제목 존재 시 정책 선택:
  - `create-or-update`: 기존 페이지 업데이트 (기본값)
  - `fail-if-exists`: 에러 발생
- 생성 후 라벨 자동 추가 (지정된 경우)

### 1.3 페이지 수정
- 페이지 ID 또는 (스페이스 키 + 제목)으로 대상 식별
- Markdown 또는 Storage HTML 입력 지원
- 버전 자동 증가 (현재 버전 조회 후 +1)
- 제목 변경 지원 (선택)

### 1.4 페이지 삭제
- 페이지 ID로 삭제
- CLI에서 삭제 전 확인 프롬프트 (--force로 스킵 가능)
- 삭제 후 휴지통으로 이동 (완전 삭제가 아님)

## 2. Markdown ↔ Confluence 변환

### 2.1 Markdown → Confluence Storage HTML
변환 파이프라인 (aicc-pm 프로젝트의 로직 참조):

1. **코드 블록 추출**: 코드 블록과 PlantUML 블록을 플레이스홀더로 치환
2. **Markdown → HTML 렌더링**: markdown-it을 사용하여 GFM 호환 HTML 생성
3. **체크박스 변환**: `- [ ]`, `- [x]` → Confluence `<ac:task-list>` 매크로
4. **매크로 복원**: 플레이스홀더를 Confluence 매크로로 변환
   - 코드 블록 → `<ac:structured-macro ac:name="code">` 매크로
   - PlantUML → `<ac:structured-macro ac:name="plantuml">` 매크로
5. **헤딩 스타일**: 헤딩에 좌측 정렬 스타일 추가
6. **테이블 처리**: HTML table 그대로 유지 (Storage 형식 호환)

### 2.2 Confluence Storage HTML → Markdown
- 기본 HTML 요소 → Markdown 역변환 (h1~h6, p, ul, ol, table, a, img 등)
- Confluence 매크로 → 코드 블록 또는 주석 처리
- 메타 정보 보존 (페이지 ID, 스페이스, 버전 등을 Markdown 프론트매터로)

## 3. 스페이스 조회
- 전체 스페이스 목록 조회 (global/personal 필터)
- 특정 스페이스 상세 조회 (키, 이름, 설명, 홈페이지)
- 스페이스 내 페이지 목록 조회

## 4. 페이지 검색
- CQL(Confluence Query Language) 기반 검색
- 간단 텍스트 검색 (CQL 자동 생성)
- 필터 옵션:
  - 스페이스 필터: `--space SPACEKEY`
  - 라벨 필터: `--label my-label`
  - 타입 필터: `--type page|blogpost`
- 검색 결과: 제목, ID, 스페이스, 발췌(excerpt), URL
- 페이지네이션 지원

## 5. 라벨 관리
- 페이지의 라벨 목록 조회
- 라벨 추가 (복수 가능)
- 라벨 삭제

## 6. 페이지 트리 조회
- 특정 페이지의 직접 자식 목록 조회
- 재귀적 트리 구성 (depth 제한 옵션)
- 트리 형태 출력 (CLI):
```
📄 상위 페이지
├── 📄 자식 페이지 1
│   ├── 📄 손자 페이지 1-1
│   └── 📄 손자 페이지 1-2
└── 📄 자식 페이지 2
```

## 7. CLI 커맨드 구조

```bash
# 페이지 조회
tdecollab confluence page get <pageId> [--format markdown|storage]
tdecollab confluence page get --space <key> --title <title>

# 페이지 생성
tdecollab confluence page create --space <key> --title <title> --file <path> [--parent <id>] [--labels <l1,l2>]

# 페이지 수정
tdecollab confluence page update <pageId> --file <path> [--title <newTitle>]

# 페이지 삭제
tdecollab confluence page delete <pageId> [--force]

# 페이지 트리
tdecollab confluence page tree <pageId> [--depth <n>]

# 스페이스
tdecollab confluence space list [--type global|personal]
tdecollab confluence space get <spaceKey>

# 검색
tdecollab confluence search <query> [--space <key>] [--label <label>] [--limit <n>]

# 라벨
tdecollab confluence label list <pageId>
tdecollab confluence label add <pageId> <labels...>
tdecollab confluence label remove <pageId> <label>

# 변환 (로컬 변환, 업로드 없이)
tdecollab confluence convert <file> [--direction md-to-storage|storage-to-md] [--output <path>]
```
