# TDE Collab Confluence for Obsidian

Obsidian 노트를 Confluence 페이지로 바로 업로드하거나, Confluence 페이지를 마크다운으로 다운로드하는 플러그인입니다.

## 기능
- **현재 노트 업로드**: `Confluence: Upload Current Note to Confluence` 명령어를 통해 현재 노트를 Confluence에 업로드합니다.
- **현재 노트 다운로드**: `Confluence: Download from Confluence (Overwrite)` 명령어를 통해 페이지를 덮어씁니다.
- 노트의 Frontmatter에 `confluence_page_id`를 자동으로 기록하여 문서를 매핑합니다.

## 설정 방법
1. 설정 -> 커뮤니티 플러그인 -> **TDE Collab Confluence** 활성화
2. 플러그인 설정 화면에서 다음 정보를 입력합니다:
   - **Confluence Base URL**: 예) `https://your-domain.atlassian.net`
   - **Email / Username**: 인증 이메일 또는 유저명
   - **API Token**: Confluence에서 발급받은 개인 접근 토큰 (PAT)
   - **Default Space Key**: 새 페이지 생성 시 사용할 기본 Space Key (예: `DEV`)
