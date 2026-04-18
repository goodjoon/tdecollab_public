# npm 패키지 등록(Publish) 가이드

이 문서는 `tdecollab` 프로젝트를 npmjs.org 에 패키지로 배포(Publish)하기 위한 절차를 안내합니다.

## 1. 사전 준비

### 1.1 npmjs.org 계정 확인
- [npmjs.org](https://www.npmjs.com/) 에 가입된 계정이 필요합니다.
- 패키지를 배포할 권한이 있는지 확인하세요. (조직(Organization) 패키지인 경우 해당 조직에 소속되어 있어야 합니다.)

### 1.2 로컬 환경 인증 (Login)
터미널에서 npm에 로그인합니다.
```bash
npm login
```
프롬프트에 따라 Username, Password, Email, OTP(설정된 경우)를 입력합니다.
로그인 상태를 확인하려면 다음 명령어를 실행합니다.
```bash
npm whoami
```

### 1.3 `package.json` 점검
배포 전 `package.json` 파일의 내용을 꼼꼼히 확인해야 합니다.

- **`name`**: 패키지 이름입니다. 중복되지 않는 고유한 이름이어야 합니다. (예: `@org/tdecollab` 처럼 조직명 스코프를 사용하는 것을 권장합니다.)
- **`version`**: 배포할 버전입니다. (예: `1.0.0`) **주의**: 이전에 배포된 버전과 동일한 버전으로는 다시 배포할 수 없습니다. 배포할 때마다 버전을 올려야 합니다. (Semantic Versioning 준수)
- **`main` / `bin`**: 패키지의 진입점과 실행 파일 경로가 올바르게 설정되어 있는지 확인합니다. (`dist/index.js`, `dist/cli.js` 등)
- **`files`**: npm 패키지에 포함될 파일/폴더 목록입니다. 보통 `["dist"]` 만 포함하여 불필요한 소스코드가 배포되지 않도록 합니다.
- **`private`**: 만약 `"private": true` 로 설정되어 있다면 삭제하거나 `false`로 변경해야 퍼블릭 배포가 가능합니다.

## 2. 빌드 및 테스트

배포 전 코드가 정상적으로 작동하고 빌드되는지 최종 확인합니다.

```bash
# 의존성 최신화
pnpm install

# 테스트 실행 (모든 테스트가 통과해야 함)
pnpm test

# 코드 포맷팅 및 린트 검사
pnpm lint

# 프로덕션 빌드 (dist/ 디렉토리 생성)
pnpm build
```

## 3. npm 배포 (Publish)

### 3.1 배포 실행
준비가 완료되었다면 프로젝트 루트 디렉토리에서 다음 명령어를 실행하여 배포합니다.

```bash
# 일반적인 퍼블릭 배포
npm publish

# 만약 스코프(@org/name)를 사용하면서 최초 퍼블릭 배포인 경우
npm publish --access public
```

*(참고: 프로젝트에서 `pnpm`을 사용하더라도 배포 시에는 `npm publish`를 사용하거나 `pnpm publish`를 사용할 수 있습니다.)*

### 3.2 배포 확인
명령어가 성공적으로 완료되면 npmjs.org 웹사이트에 로그인하여 패키지가 정상적으로 업데이트되었는지 확인합니다.
터미널에서도 설치 테스트를 해볼 수 있습니다.
```bash
npm install -g <your-package-name>
```

## 4. 버전 관리 및 업데이트 (추후 배포 시)

코드가 수정되어 새로운 버전을 배포해야 할 때의 절차입니다.

1. 코드 수정 완료 및 테스트/빌드 (`pnpm test`, `pnpm build`)
2. 버전 업데이트
   ```bash
   # Patch (버그 수정 등) - 1.0.0 -> 1.0.1
   npm version patch

   # Minor (새로운 기능 추가) - 1.0.0 -> 1.1.0
   npm version minor

   # Major (호환되지 않는 API 변경) - 1.0.0 -> 2.0.0
   npm version major
   ```
   *(이 명령어는 `package.json`의 버전을 올리고, Git 태그를 자동으로 생성합니다.)*
3. 변경된 내용을 Git 저장소에 푸시 (선택사항)
   ```bash
   git push origin main --tags
   ```
4. 배포
   ```bash
   npm publish
   ```
