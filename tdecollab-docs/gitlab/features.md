# GitLab 기능 정의

## 1. 프로젝트 조회
- 접근 가능한 프로젝트 목록 조회
  - 소유 프로젝트 필터 (`--owned`)
  - 멤버십 프로젝트 필터 (`--membership`)
  - 키워드 검색 (`--search`)
- 프로젝트 상세 조회
  - 이름, 네임스페이스, 기본 브랜치, 가시성
  - 웹 URL, Git URL (SSH/HTTP)
  - 최근 활동 시간

## 2. MR(Merge Request) 관리

### 2.1 MR 조회
- 프로젝트별 MR 목록
  - 상태 필터: opened, closed, merged, all
  - 범위 필터: 내가 생성한 MR, 나에게 할당된 MR
- MR 상세 조회
  - 제목, 설명, 소스/타겟 브랜치, 상태, 작성자, 담당자
  - 머지 상태 (머지 가능 여부, 충돌 여부)
  - 파이프라인 상태
  - 변경 파일 목록 (선택)

### 2.2 MR 생성
- 필수 입력: 소스 브랜치, 타겟 브랜치, 제목
- 선택 입력: 설명, 담당자, 리뷰어, 라벨
- 생성 후 MR URL 반환

### 2.3 MR 관리
- MR 머지 실행
  - 스쿼시 머지 옵션
  - 소스 브랜치 자동 삭제 옵션
  - 커스텀 머지 커밋 메시지
- MR 상태 변경 (close / reopen)
- MR 코멘트(노트) 추가

## 3. 파이프라인 조회
- 프로젝트 파이프라인 목록
  - 상태 필터: running, success, failed 등
  - 브랜치/태그 필터
- 파이프라인 상세
  - 상태, ref(브랜치), SHA, 시작/종료 시간, 소요 시간
  - 웹 URL
- 파이프라인 작업(Job) 목록
  - 각 작업의 이름, 스테이지, 상태, 소요 시간
- MR 연관 파이프라인 조회

## 4. 브랜치 관리
- 브랜치 목록 조회
  - 키워드 검색 지원
  - 보호 브랜치 여부 표시
- 브랜치 상세 조회
  - 최신 커밋 정보 (SHA, 메시지, 작성자)
  - 머지 여부, 보호 여부
- 브랜치 생성
  - 기준 ref(브랜치/태그/커밋) 지정
- 브랜치 삭제
  - 보호 브랜치는 삭제 불가 경고

## 5. 파일 조회
- 특정 파일 내용 조회
  - 브랜치/커밋 기준 지정 (기본: 기본 브랜치)
  - Base64 디코딩 자동 처리
  - 파일 크기, 마지막 커밋 정보 포함
- 디렉토리 트리 조회
  - 경로 지정 (기본: 루트)
  - 재귀 조회 옵션
  - 트리 형태 출력 (CLI)

## 6. CLI 커맨드 구조

```bash
# 프로젝트
tdecollab gitlab project list [--search <query>] [--owned] [--membership]
tdecollab gitlab project get <projectId>

# MR
tdecollab gitlab mr list <projectId> [--state opened|closed|merged|all] [--scope created_by_me|assigned_to_me]
tdecollab gitlab mr get <projectId> <mrIid> [--changes]
tdecollab gitlab mr create <projectId> --source <branch> --target <branch> --title <text> [--description <text>]
tdecollab gitlab mr merge <projectId> <mrIid> [--squash] [--remove-source-branch]
tdecollab gitlab mr close <projectId> <mrIid>
tdecollab gitlab mr comment <projectId> <mrIid> --body <text>

# 파이프라인
tdecollab gitlab pipeline list <projectId> [--status <status>] [--ref <branch>]
tdecollab gitlab pipeline get <projectId> <pipelineId> [--jobs]

# 브랜치
tdecollab gitlab branch list <projectId> [--search <query>]
tdecollab gitlab branch get <projectId> <branchName>
tdecollab gitlab branch create <projectId> --name <branch> --ref <ref>
tdecollab gitlab branch delete <projectId> <branchName>

# 파일
tdecollab gitlab file get <projectId> <filePath> [--ref <ref>]
tdecollab gitlab file tree <projectId> [--path <dir>] [--ref <ref>] [--recursive]
```
