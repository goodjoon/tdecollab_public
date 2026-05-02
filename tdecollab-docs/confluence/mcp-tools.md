# Confluence MCP 도구 스펙

## 개요
Confluence 관련 MCP 도구 9개를 정의한다. 모든 도구는 `confluence_` 접두사를 사용한다.

## 1. confluence_get_page

페이지 ID로 Confluence 페이지를 조회하여 제목, 본문, 메타데이터를 반환한다.

### 입력 스키마
| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| `pageId` | string | O | | 페이지 ID |
| `format` | enum | | `"markdown"` | 본문 반환 형식: `"markdown"` 또는 `"storage"` |
| `expand` | string[] | | | 추가 확장 필드 (`ancestors`, `children.page`, `version`) |

### 출력
```json
{
  "id": "12345",
  "title": "페이지 제목",
  "spaceKey": "SPACE",
  "content": "# 페이지 제목\n\n본문 내용...",
  "version": 5,
  "url": "https://confluence.tde.example.com/pages/viewpage.action?pageId=12345",
  "lastModified": "2024-01-15T10:30:00Z",
  "lastModifiedBy": "사용자명"
}
```

## 2. confluence_create_page

Markdown 콘텐츠를 Confluence 페이지로 생성한다.

### 입력 스키마
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `spaceKey` | string | O | 대상 스페이스 키 |
| `title` | string | O | 페이지 제목 |
| `content` | string | O | Markdown 본문 |
| `parentPageId` | string | | 상위 페이지 ID (없으면 스페이스 루트) |
| `labels` | string[] | | 라벨 목록 |

### 출력
```json
{
  "id": "12346",
  "title": "새 페이지",
  "url": "https://confluence.tde.example.com/pages/viewpage.action?pageId=12346",
  "spaceKey": "SPACE",
  "version": 1
}
```

## 3. confluence_update_page

기존 Confluence 페이지의 내용을 업데이트한다.

### 입력 스키마
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `pageId` | string | O | 페이지 ID |
| `content` | string | O | 새 Markdown 본문 |
| `title` | string | | 변경할 제목 (미입력 시 기존 제목 유지) |

### 출력
업데이트된 페이지 정보 (id, title, version, url)

## 4. confluence_delete_page

Confluence 페이지를 삭제한다 (휴지통으로 이동).

### 입력 스키마
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `pageId` | string | O | 삭제할 페이지 ID |

### 출력
```json
{
  "success": true,
  "message": "페이지가 삭제되었습니다 (휴지통으로 이동)"
}
```

## 5. confluence_search_pages

CQL 또는 텍스트로 Confluence 페이지를 검색한다.

### 입력 스키마
| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| `query` | string | O | | 검색어 또는 CQL 쿼리 |
| `spaceKey` | string | | | 스페이스 필터 |
| `limit` | number | | 10 | 최대 결과 수 |

### 출력
```json
{
  "results": [
    {
      "id": "12345",
      "title": "검색된 페이지",
      "spaceKey": "SPACE",
      "excerpt": "...검색어가 포함된 발췌...",
      "url": "https://..."
    }
  ],
  "totalSize": 42
}
```

## 6. confluence_get_page_tree

특정 페이지의 하위 페이지 트리를 조회한다.

### 입력 스키마
| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| `pageId` | string | O | | 루트 페이지 ID |
| `depth` | number | | 2 | 트리 깊이 제한 (1~5) |

### 출력
```json
{
  "id": "12345",
  "title": "루트 페이지",
  "children": [
    {
      "id": "12346",
      "title": "자식 페이지 1",
      "children": [
        { "id": "12347", "title": "손자 페이지 1-1", "children": [] }
      ]
    },
    {
      "id": "12348",
      "title": "자식 페이지 2",
      "children": []
    }
  ]
}
```

## 7. confluence_get_spaces

Confluence 스페이스 목록을 조회한다.

### 입력 스키마
| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| `type` | enum | | | 스페이스 유형: `"global"` 또는 `"personal"` |
| `limit` | number | | 25 | 최대 결과 수 |

### 출력
```json
{
  "results": [
    {
      "key": "SPACE",
      "name": "스페이스 이름",
      "type": "global",
      "url": "https://..."
    }
  ]
}
```

## 8. confluence_manage_labels

페이지의 라벨을 조회, 추가, 삭제한다.

### 입력 스키마
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `pageId` | string | O | 페이지 ID |
| `action` | enum | O | `"list"`, `"add"`, `"remove"` |
| `labels` | string[] | △ | action이 `add` 또는 `remove`일 때 필수 |

### 출력
```json
{
  "labels": ["label1", "label2", "label3"],
  "action": "add",
  "message": "라벨 2개가 추가되었습니다"
}
```

## 9. confluence_convert_content

Markdown과 Confluence Storage 형식 간 변환한다. 서버에 업로드하지 않고 로컬에서 변환만 수행.

### 입력 스키마
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `content` | string | O | 변환할 콘텐츠 |
| `direction` | enum | O | `"md-to-storage"` 또는 `"storage-to-md"` |

### 출력
```json
{
  "original": "# 제목\n\n본문",
  "converted": "<h1>제목</h1><p>본문</p>",
  "direction": "md-to-storage"
}
```
