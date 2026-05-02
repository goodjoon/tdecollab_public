# Confluence 이미지 다운로드 기능 구현 완료

## 구현 내용

Confluence 페이지 다운로드 시 페이지 내 이미지를 함께 다운로드하여 로컬 파일로 저장하고, Markdown에서 참조할 수 있도록 개선했습니다.

## 변경된 파일

### 1. 타입 정의 추가
**파일**: `src/confluence/types.ts`
- `ConfluenceAttachmentResponse` 인터페이스 추가
- Confluence attachment API 응답 구조 정의

### 2. Confluence Content API 확장
**파일**: `src/confluence/api/content.ts`
- `getAttachments(pageId, filename?)`: 페이지의 attachment 목록 조회
- `downloadAttachment(downloadUrl)`: attachment 바이너리 다운로드
- attachment와 외부 URL 이미지 모두 지원

### 3. 이미지 다운로드 유틸리티 추가
**파일**: `src/confluence/utils/image-downloader.ts` (신규)

주요 기능:
- Storage Format HTML에서 이미지 참조 추출
  - `<ac:image>` 태그 (Confluence attachment)
  - `<img>` 태그 (외부 URL)
- 이미지 다운로드 및 로컬 저장
- 파일명 중복 처리 (자동 번호 부여)
- 파일명 sanitization (특수문자 처리)
- 에러 핸들링 (다운로드 실패 시에도 계속 진행)

### 4. Markdown 변환기 개선
**파일**: `src/confluence/converters/storage-to-md.ts`
- `convert(storageHtml, imageUrlMap?)` 메서드 시그니처 변경
- imageUrlMap 제공 시 로컬 경로로 변환
- imageUrlMap 없을 시 원본 URL 유지
- 이미지 태그 변환 로직:
  - `<ac:image><ri:attachment>` → `![filename](local-path)`
  - `<ac:image><ri:url>` → `![filename](url)`
  - `<img src="...">` → `![alt](src)`

### 5. CLI 명령 개선
**파일**: `src/confluence/commands/index.ts`

`confluence page get` 명령에 새로운 옵션 추가:
- `-d, --download-images`: 이미지 다운로드 활성화
- `--image-dir <path>`: 이미지 저장 디렉토리 (기본값: `./images`)
- `-o, --output <file>`: Markdown을 파일로 저장

### 6. MCP Tool 개선
**파일**: `src/confluence/tools/index.ts`

`confluence_get_page` tool에 파라미터 추가:
- `downloadImages?: boolean`: 이미지 다운로드 여부
- `imageDir?: string`: 이미지 저장 디렉토리
- 응답에 다운로드된 이미지 개수 정보 포함

### 7. 문서 업데이트
**파일**: `README.md`
- 이미지 다운로드 기능 사용 예제 추가

## 사용 예제

### CLI 사용

```bash
# 기본 사용 (이미지를 ./images에 다운로드)
tdecollab confluence page get 12345 --download-images

# 커스텀 디렉토리에 다운로드
tdecollab confluence page get 12345 -d --image-dir ./my-images

# Markdown 파일로 저장
tdecollab confluence page get 12345 -d -o page.md

# 이미지와 함께 저장 (완전한 백업)
tdecollab confluence page get 12345 -d --image-dir ./assets -o page.md
```

### MCP Tool 사용

Claude Desktop에서:
```
"12345 페이지를 이미지와 함께 다운로드해줘"
```

Tool 호출:
```json
{
  "pageId": "12345",
  "downloadImages": true,
  "imageDir": "./images"
}
```

## 기술적 특징

### 1. 이미지 형식 지원
- **Confluence Attachment**: `<ac:image><ri:attachment ri:filename="..."/></ac:image>`
- **외부 URL**: `<ac:image><ri:url ri:value="..."/></ac:image>`
- **일반 HTML**: `<img src="..." alt="..."/>`

### 2. 파일 관리
- 파일명 중복 시 자동 번호 부여 (`image.png`, `image_1.png`, `image_2.png`)
- 특수문자 sanitization (안전한 파일명 생성)
- 디렉토리 자동 생성

### 3. 에러 핸들링
- 개별 이미지 다운로드 실패 시에도 계속 진행
- 실패한 이미지는 원본 URL 유지
- 상세한 로그 출력 (성공/실패 개수)

### 4. 성능 고려
- 동적 import 사용 (`await import('../utils/image-downloader.js')`)
- 옵션이 활성화된 경우에만 로드
- 메모리 효율적인 Buffer 사용

## 테스트 시나리오

1. ✅ Attachment 이미지가 포함된 페이지 다운로드
2. ✅ 외부 URL 이미지가 포함된 페이지 다운로드
3. ✅ 이미지가 없는 페이지 다운로드
4. ✅ 이미지 다운로드 없이 페이지만 조회
5. ✅ 파일로 저장 옵션 테스트
6. ✅ 파일명 중복 처리 테스트
7. ✅ 네트워크 오류 시 에러 핸들링

## 빌드 결과

```bash
pnpm build
# ✅ Build success
# - image-downloader-TO274OMP.js (3.96 KB)
# - 모든 타입 정의 포함
```

## 향후 개선 사항

1. **진행률 표시**: 대용량 이미지 다운로드 시 progress bar 추가
2. **재시도 로직**: 네트워크 오류 시 자동 재시도
3. **이미지 최적화**: 다운로드 시 이미지 압축 옵션
4. **캐싱**: 동일 이미지 중복 다운로드 방지
5. **병렬 다운로드**: 여러 이미지 동시 다운로드로 성능 개선

## 관련 이슈

- 이미지가 다운로드되지 않는 문제 해결
- Markdown 변환 시 이미지 참조 유지
- 로컬 백업 기능 지원
