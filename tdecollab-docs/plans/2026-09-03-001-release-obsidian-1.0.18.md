# Obsidian 1.0.18 Release

## 목적

Confluence Storage XML에서 raw HTML `<br>`가 닫히지 않아 upload가 실패하는 문제를 공개 release에 반영한다.

## Release 결정

| 대상 | 이전 버전 | 새 버전 | 이유 |
|---|---:|---:|---|
| Obsidian plugin | 1.0.17 | 1.0.18 | XHTML line break 정규화 bug fix |
| npm package | 0.4.0 | 0.4.1 | 공통 Markdown converter bug fix |

## 배포 순서

1. `main`을 `origin`에 push한다.
2. orphan `release` branch에 `main`의 파일 상태를 반영하고 release commit을 만든다.
3. `public` remote의 `main`에 `release`를 push한다.
4. `obsidian-1.0.18` tag를 `public`에 push한다.

`twin` remote는 현재 repository에 등록되어 있지 않아 이번 release 범위에서 제외한다.

## 검증 기준

- root와 Obsidian plugin의 production build가 통과한다.
- root 및 plugin test가 통과한다.
- `main`과 `public/main`이 각각 의도한 commit을 가리킨다.
