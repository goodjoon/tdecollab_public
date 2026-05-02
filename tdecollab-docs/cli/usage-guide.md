---
confluence_page_id: 1028470454
---

# tdecollab CLI 사용 가이드

`tdecollab`은 터미널 환경에서 TDE 포털의 주요 서비스(Confluence, JIRA, GitLab)를 손쉽게 사용할 수 있도록 다양한 명령어를 제공합니다!.

---

## 📖 목차
1. [Confluence 사용법](#1-confluence-사용법)
2. [JIRA 사용법](#2-jira-사용법)
3. [GitLab 사용법](#3-gitlab-사용법)

---

## 1. Confluence 사용법

가장 많이 활용되는 기능 중 하나는 Confluence 페이지와 로컬 Markdown 파일 간의 동기화 기능입니다.

### 📝 페이지 조회 및 다운로드 (Markdown 변환)

Confluence에 작성된 페이지를 터미널로 가져오거나 로컬 Markdown 파일로 저장할 수 있습니다. 

```bash
# 기본 조회 (터미널 출력)
tdecollab confluence page get <pageId>

# 메타데이터를 제외한 순수 본문만 확인
tdecollab confluence page get <pageId> --quiet

# HTML 소스 (Storage Format) 그대로 확인
tdecollab confluence page get <pageId> --raw
```

#### 💡 [핵심 기능] 이미지와 함께 Markdown으로 완벽하게 다운로드하기

Confluence 문서를 로컬 Markdown 파일로 백업하거나 다른 곳에 재사용하고 싶을 때 매우 유용합니다. 페이지에 첨부된 이미지들을 로컬 폴더로 다운로드하고, Markdown 내의 이미지 경로를 로컬 경로로 자동 변환해 줍니다.

```bash
# 옵션 설명:
# -d, --download-images : 이미지를 다운로드 합니다.
# --image-dir <path>    : 이미지를 저장할 로컬 디렉토리 (기본값: ./images)
# -o, --output <file>   : 결과를 저장할 Markdown 파일 경로

# 가장 권장하는 다운로드 방식
tdecollab confluence page get 12345678 -d --image-dir ./assets -o ./docs/my-page.md
```
위 명령어를 실행하면:
1. `12345678` 페이지 본문이 Markdown 포맷으로 변환되어 `./docs/my-page.md`에 저장됩니다.
2. 페이지에 포함된 이미지들은 `./docs/assets/` 폴더에 모두 다운로드됩니다.
3. `my-page.md` 내의 이미지 경로는 `![img](assets/image1.png)`와 같이 상대 경로로 자동 연결됩니다.

---

### 🚀 페이지 생성 및 로컬 이미지 자동 업로드

Markdown 파일로 작성한 문서를 Confluence 새 페이지로 쉽게 업로드할 수 있습니다. 이때 **로컬 이미지가 포함되어 있다면, Confluence에 자동으로 첨부하고 본문에 연결해 줍니다.**

```bash
# 옵션 설명:
# -s, --space <key>   : 스페이스 키 (필수)
# -t, --title <title> : 페이지 제목 (필수)
# -f, --file <path>   : 업로드할 Markdown 파일 경로 (이 방식을 강력히 권장합니다)
# -p, --parent <id>   : 생성할 위치의 부모 페이지 ID (선택)

# 로컬 Markdown 파일로 새 페이지 생성 (로컬 이미지 자동 업로드 지원!)
tdecollab confluence page create --space MYSPACE --title "신규 프로젝트 기획안" --file ./docs/plan.md
```
> **로컬 이미지 처리 원리**: 
> `--file` 옵션을 사용하면 `plan.md` 파일이 위치한 `./docs/`를 기준 디렉토리로 삼습니다. 만약 문서 내용에 `![건축도](images/arch.png)`가 있다면 `./docs/images/arch.png` 파일을 찾아 Confluence 페이지의 첨부파일로 업로드한 후, 페이지 본문에서 해당 첨부파일을 바라보도록 렌더링합니다.

---

### ✏️ 기존 페이지 업데이트하기

업데이트 명령어는 페이지 생성과 동일한 편의성을 제공합니다. **기존 페이지의 버전 정보를 자동으로 계산**하여 덮어쓰기 오류를 방지하며, 새로운 이미지가 추가되었다면 해당 이미지도 함께 업로드합니다.

```bash
# 페이지 제목 유지 + 본문만 Markdown 파일로 덮어쓰기
tdecollab confluence page update 12345678 --file ./docs/plan-v2.md

# 제목도 함께 변경
tdecollab confluence page update 12345678 --title "신규 프로젝트 기획안 (수정본)" --file ./docs/plan-v2.md
```

---

### 🔍 스페이스 및 검색 기능

```bash
# 사용 가능한 스페이스 목록 확인
tdecollab confluence space list

# CQL(Confluence Query Language)을 활용한 강력한 검색
tdecollab confluence search "title ~ '가이드'"
tdecollab confluence search "space = MYSPACE AND type = page"
```

---

## 2. JIRA 사용법

터미널에서 JIRA 이슈를 조회하고 상태를 변경할 수 있습니다.

### 이슈 관리
```bash
# 이슈 상세 정보 및 서브태스크 확인
tdecollab jira issue get PROJ-123

# 새 이슈 생성 (라벨은 쉼표로 구분)
tdecollab jira issue create -p PROJ -s "API 오류 수정" -t Bug -a "john.doe" -l "backend,hotfix"

# 이슈 수정 (우선순위 변경 등)
tdecollab jira issue update PROJ-123 --priority High
```

### 상태 변경 (Transition)
```bash
# 변경 가능한 상태(트랜지션) ID 목록 확인
tdecollab jira issue transition PROJ-123 -l

# 상태 변경 실행 (예: In Progress 상태의 ID가 21일 때)
tdecollab jira issue transition PROJ-123 -t 21
```

### JQL 검색 및 코멘트
```bash
# 내가 담당자인 이슈 검색
tdecollab jira search "assignee = currentUser() AND status != Done" -n 20

# 코멘트 추가
tdecollab jira comment add PROJ-123 "원인 파악 완료, 내일 중 패치 예정입니다."
```

### 프로젝트 및 보드 조회
```bash
# 프로젝트 목록 및 상세
tdecollab jira project list
tdecollab jira project get PROJ

# Agile 보드 및 스프린트 상태
tdecollab jira board list -p PROJ
tdecollab jira board sprints 42 -s active
```

---

## 3. GitLab 사용법

Merge Request 처리와 파이프라인 확인을 터미널에서 빠르게 처리하세요.

### 프로젝트 조회
```bash
# 내가 속한 프로젝트 검색
tdecollab gitlab project list --membership --search "backend"
tdecollab gitlab project get 881
```

### Merge Request (MR) 관리
```bash
# 열려있는 MR 목록 확인
tdecollab gitlab mr list 881 -s opened

# MR 상세 정보 (변경된 파일 목록 포함)
tdecollab gitlab mr get 881 42 --changes

# 새 MR 생성
tdecollab gitlab mr create 881 --source feature/new-api --target main --title "신규 API 추가"

# MR 코멘트 달기 및 Merge (Squash 옵션, 소스 브랜치 삭제)
tdecollab gitlab mr comment 881 42 -b "LGTM!"
tdecollab gitlab mr merge 881 42 --squash --remove-source-branch
```

### 파이프라인 확인
```bash
# 특정 브랜치의 최근 파이프라인 내역
tdecollab gitlab pipeline list 881 --ref main

# 특정 파이프라인의 Job 진행 상태 상세 확인
tdecollab gitlab pipeline get 881 10045 --jobs
```

### 브랜치 및 소스코드
```bash
# 새 브랜치 생성 및 삭제
tdecollab gitlab branch create 881 --name feature/hotfix-login --ref main
tdecollab gitlab branch delete 881 feature/old-branch

# 특정 파일 내용 터미널에서 즉시 확인
tdecollab gitlab file get 881 "src/config.ts" --ref feature/hotfix-login
```
