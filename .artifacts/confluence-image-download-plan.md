# Confluence 이미지 다운로드 기능 구현 계획

## 목표
Confluence 페이지 다운로드 시 페이지 내 이미지를 함께 다운로드하여 로컬 파일로 저장하고, Markdown에서 참조할 수 있도록 개선

## 현재 상황
- `confluence page get` 명령으로 페이지를 조회할 수 있음
- Storage Format HTML을 Markdown으로 변환하는 기능 존재
- 하지만 이미지 태그는 처리하지 않아 이미지가 표시되지 않음

## Confluence 이미지 형식

### 1. Attachment 이미지
```xml
<ac:image>
  <ri:attachment ri:filename="image.png" />
</ac:image>
```

### 2. 외부 URL 이미지
```xml
<ac:image>
  <ri:url ri:value="https://example.com/image.png" />
</ac:image>
```

### 3. 일반 HTML img 태그
```html
<img src="https://example.com/image.png" />
```

## 구현 단계

### 1단계: Confluence Attachment API 추가
**파일**: `src/confluence/api/content.ts`

- `getAttachment(pageId: string, filename: string)` 메서드 추가
  - Endpoint: `GET /rest/api/content/{pageId}/child/attachment`
  - 특정 파일명의 attachment 정보 조회
  
- `downloadAttachment(downloadUrl: string)` 메서드 추가
  - attachment의 download URL로 바이너리 데이터 다운로드
  - `responseType: 'arraybuffer'` 사용

### 2단계: 이미지 다운로드 유틸리티 추가
**파일**: `src/confluence/utils/image-downloader.ts` (신규)

주요 기능:
- Storage Format HTML에서 이미지 참조 추출
  - `<ac:image>` 태그 파싱
  - `<img>` 태그 파싱
- 이미지 다운로드 및 로컬 저장
  - Attachment 이미지: Confluence API 사용
  - 외부 URL 이미지: HTTP 요청
- 파일명 중복 처리
- 다운로드 진행 상황 로깅

클래스 구조:
```typescript
export interface ImageDownloadOptions {
  outputDir: string;        // 이미지 저장 디렉토리
  pageId: string;           // 페이지 ID
  baseUrl: string;          // Confluence base URL
}

export interface ImageReference {
  type: 'attachment' | 'url';
  filename?: string;        // attachment인 경우
  url?: string;            // URL인 경우
  originalTag: string;     // 원본 태그
}

export class ImageDownloader {
  constructor(private api: ConfluenceContentApi, private options: ImageDownloadOptions);
  
  // Storage HTML에서 이미지 참조 추출
  extractImageReferences(html: string): ImageReference[];
  
  // 이미지 다운로드 및 로컬 경로 반환
  async downloadImage(ref: ImageReference): Promise<string>;
  
  // 모든 이미지 다운로드 및 매핑 반환
  async downloadAllImages(html: string): Promise<Map<string, string>>;
}
```

### 3단계: StorageToMarkdownConverter 개선
**파일**: `src/confluence/converters/storage-to-md.ts`

- 생성자에 `imageUrlMap?: Map<string, string>` 파라미터 추가
- 이미지 태그 변환 로직 추가:
  - `<ac:image>` → `![alt](local-path)`
  - `<img>` → `![alt](local-path)`
- imageUrlMap이 제공된 경우 로컬 경로로 변환, 없으면 원본 URL 유지

### 4단계: CLI 명령 개선
**파일**: `src/confluence/commands/index.ts`

`page get` 명령에 옵션 추가:
- `--download-images` 또는 `-d`: 이미지 다운로드 활성화
- `--image-dir <path>`: 이미지 저장 디렉토리 (기본값: `./images`)
- `--output <file>` 또는 `-o`: Markdown을 파일로 저장

구현 흐름:
1. 페이지 조회
2. `--download-images` 옵션이 있으면:
   - ImageDownloader 인스턴스 생성
   - 이미지 다운로드 및 매핑 생성
   - StorageToMarkdownConverter에 매핑 전달
3. Markdown 변환
4. `--output` 옵션이 있으면 파일로 저장, 없으면 콘솔 출력

### 5단계: MCP Tool 개선
**파일**: `src/confluence/tools/index.ts`

`confluence_get_page` tool에 파라미터 추가:
- `downloadImages?: boolean`
- `imageDir?: string`

응답에 다운로드된 이미지 정보 포함

## 파일 구조
```
src/confluence/
├── api/
│   └── content.ts          # attachment API 추가
├── utils/
│   └── image-downloader.ts # 신규: 이미지 다운로드 유틸리티
├── converters/
│   └── storage-to-md.ts    # 이미지 변환 로직 추가
├── commands/
│   └── index.ts            # CLI 옵션 추가
└── tools/
    └── index.ts            # MCP tool 파라미터 추가
```

## 테스트 시나리오
1. Attachment 이미지가 포함된 페이지 다운로드
2. 외부 URL 이미지가 포함된 페이지 다운로드
3. 이미지가 없는 페이지 다운로드
4. 이미지 다운로드 없이 페이지만 조회
5. 파일로 저장 옵션 테스트

## 주의사항
- 대용량 이미지 처리 시 메모리 사용량 고려
- 네트워크 오류 시 재시도 로직 필요
- 파일명 sanitization (특수문자 처리)
- 이미지 다운로드 실패 시에도 Markdown 변환은 계속 진행
