# Obsidian 이미지 다운로드 경로 및 0 byte 파일 수정

## 배경

Obsidian plugin의 Confluence 다운로드에서 다음 문제가 확인되었다.

| 문제              | 기존 동작                             | 수정 방향                                                    |
| --------------- | --------------------------------- | -------------------------------------------------------- |
| 이미지 저장 위치       | `assets/`가 vault root 하위에 생성됨     | 최종 Markdown 문서 저장 디렉토리 하위에 생성                            |
| Markdown 이미지 링크 | vault root 기준 상대 경로 사용            | 문서 디렉토리 기준 상대 경로 사용                                      |
| 이미지 파일 크기       | Obsidian plugin에서 0 byte 파일 생성 가능 | Obsidian `requestUrl`로 binary를 받고 `DataAdapter.writeBinary`에 정확한 `ArrayBuffer` 전달 |

## 수정 설계

CLI는 Node 파일 시스템에 직접 쓰는 `ImageDownloader`를 계속 사용한다. Obsidian plugin은 vault 내부 파일 쓰기 규칙과 Obsidian 네트워크 API를 따라야 하므로 plugin 전용 downloader를 분리한다.

```mermaid
flowchart TD
  A[Download from Confluence] --> B[저장 모드 확인]
  B --> C{overwrite?}
  C -->|yes| D[현재 노트 parent.path]
  C -->|no| E[defaultDownloadPath]
  D --> F[문서 저장 디렉토리]
  E --> F
  F --> G[imageDir를 문서 디렉토리 하위로 resolve]
  G --> H[Vault folder 생성]
  H --> I[Confluence attachment download URL 확인]
  I --> J[Obsidian requestUrl arrayBuffer 다운로드]
  J --> K{0 byte?}
  K -->|yes| M[저장 중단 및 console error]
  K -->|no| N[정확한 ArrayBuffer로 변환]
  N --> O[adapter.writeBinary]
  O --> L[문서 디렉토리 기준 Markdown 링크 생성]
```

## 2026-05-03 추가 조사

`files/download/assets/lvmf.arch.draw.v2-01.svg`가 생성되지만 0 byte인 사례가 확인되었다. CLI 다운로드는 정상이라 Confluence attachment URL 자체보다는 Obsidian plugin 런타임에서 shared Axios 다운로드 경로가 binary payload를 안정적으로 전달하지 못하는 경계 문제로 판단했다.

수정 원칙:

| 경계 | 변경 |
|---|---|
| HTTP binary download | Obsidian plugin은 `requestUrl({ url, method: 'GET', headers, throw: true }).arrayBuffer` 사용 |
| 인증 | 기존 설정의 Basic/Bearer 인증 헤더를 `requestUrl`에도 명시적으로 전달 |
| 저장 전 검증 | `ArrayBuffer.byteLength === 0`이면 파일을 쓰지 않고 console error 출력 |
| 진단 로그 | status, bytes, content-type, content-length, 저장 경로를 console에 출력 |

## 검증

| 검증 항목 | 명령 |
|---|---|
| Obsidian image helper 단위 테스트 | `pnpm --dir packages/obsidian-plugin test -- --run tests/image-download.test.ts` |
| Obsidian plugin production build | `pnpm --dir packages/obsidian-plugin build` |
| 기존 CLI/shared downloader 회귀 테스트 | `pnpm test:run tests/confluence/utils/image-downloader.test.ts` |
