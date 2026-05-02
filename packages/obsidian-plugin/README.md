# TDE Collab Confluence for Obsidian

Obsidian 노트를 Confluence 페이지로 바로 업로드하거나, Confluence 페이지를 마크다운으로 다운로드하는 플러그인입니다.

## 기능
- **현재 노트 업로드**: `Confluence: Upload Current Note to Confluence` 명령어를 통해 현재 노트를 Confluence에 업로드합니다.
- **현재 노트 다운로드**: `Confluence: Download from Confluence (Overwrite)` 명령어를 통해 페이지를 덮어씁니다.
- 노트의 Frontmatter에 `confluence_page_id`를 자동으로 기록하여 문서를 매핑합니다.

## 설치 방법 (BRAT 사용)
이 플러그인은 현재 베타 릴리즈 상태이므로 **BRAT** 플러그인을 통해 설치하는 것을 권장합니다.

1. Obsidian의 **설정 -> 커뮤니티 플러그인 -> 탐색**을 클릭합니다.
2. 검색창에 **BRAT**을 검색하여 `Obsidian42 - BRAT` 플러그인을 설치하고 활성화합니다.
3. 명령어 팔레트(`Cmd + P` 또는 `Ctrl + P`)를 열고 **`BRAT: Add a beta plugin for testing`** 명령어를 실행합니다.
4. 입력창에 본 레포지토리 주소인 **`goodjoon/tdecollab_public`** 을 입력하고 `Add Plugin` 버튼을 누릅니다.
5. 다시 **설정 -> 커뮤니티 플러그인** 목록으로 돌아가서 새로 추가된 **TDE Collab Confluence** 플러그인을 활성화합니다.

## 설정 방법
1. 설정 -> 커뮤니티 플러그인 -> **TDE Collab Confluence** 활성화
2. 플러그인 설정 화면에서 다음 정보를 입력합니다:
   - **Confluence Base URL**: 예) `https://your-domain.atlassian.net`
   - **Email / Username**: 인증 이메일 또는 유저명
   - **API Token**: Confluence에서 발급받은 개인 접근 토큰 (PAT)
   - **Default Space Key**: 새 페이지 생성 시 사용할 기본 Space Key (예: `DEV`)
