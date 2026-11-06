# 크롭노트 원본 소스

최근 배포 버전 7의 원본입니다. 선 1개 기울기 보정, 가로 2개·세로 2개 원근 보정, 영역 자동 맞춤, 출력 배율과 ZIP 저장 기능을 포함합니다. 이미지 처리는 브라우저에서 실행하며 별도 백엔드·데이터베이스·API 키는 필요 없습니다.

## VS Code 실행

1. 압축을 풀고 `crop-note-source` 폴더를 VS Code로 엽니다.
2. Node.js 20 이상을 설치합니다.
3. 터미널에서 실행합니다. 외부 패키지가 없어 `npm install`은 필요 없습니다.

```sh
npm run dev
```

브라우저에서 http://localhost:5173 을 엽니다. 파일을 수정한 뒤 새로고침합니다. 종료는 Ctrl+C입니다. 원근 보정은 Web Worker를 사용하므로 HTML을 더블 클릭하기보다 이 방법으로 실행하세요. 개발 서버는 내 PC에서만 실행되며 실제 정적 배포에는 필요 없습니다.

## 수정 위치

`dist` 폴더 안의 HTML·CSS·JavaScript가 직접 수정할 원본입니다. 별도 빌드 과정은 없습니다.

| 파일 | 역할 |
|---|---|
| `dist/index.html`, `dist/style.css` | 화면 구성과 스타일 |
| `dist/app.js` | 이미지 불러오기, 크롭, 미리보기, 배율, PNG·ZIP 저장 |
| `dist/guides.js` | 가이드와 격자, 영역 자동 맞춤 |
| `dist/dimensions.js` | 영역 크기·비율 |
| `dist/rotation.js`, `dist/rotation.css` | 회전·캔버스 확장 |
| `dist/navigation.js`, `dist/navigation.css` | 화면 이동·확대·터치 |
| `dist/correction.js` | 기준선 보정 UI, 원본 복원 |
| `dist/correction-math.js` | 기울기·원근 보정 계산 |
| `dist/correction-worker.js` | 브라우저 백그라운드 원근 보정 |
| `verify*.cjs` | 회귀검사 |

## 검사

```sh
npm test
```

검사 중 생성되는 `outputs` 폴더는 Git에서 제외됩니다. 계산·상태·저장 관련 검사이며 실제 브라우저 조작 검사를 대신하지 않습니다. 최신 기능은 당시 브라우저 연결 지연으로 최종 화면 검증을 완료하지 못했습니다.

## GitHub에 처음 올리기

GitHub에서 빈 저장소를 만들고 아래 주소를 본인의 실제 저장소 주소로 바꿔 실행하세요. GitHub 인증은 VS Code/Git 안내에 따라 진행합니다.

```sh
git init
git add .
git commit -m "Initial Crop Note source"
git branch -M main
git remote add origin https://github.com/YOUR_ACCOUNT/YOUR_REPOSITORY.git
git push -u origin main
```

이후 VS Code 소스 제어 또는 Sourcetree에서 커밋하고 푸시하면 됩니다.

## Cloudflare Pages 설정

GitHub 저장소를 연결하고 다음과 같이 지정합니다.

| 설정 | 값 |
|---|---|
| Production branch | `main` |
| Framework preset | `None` |
| Build command | `exit 0` |
| Build output directory | `dist` |
| Root directory | 저장소 루트, 기본값 유지 |

`dist`의 파일을 모두 배포하세요. 특히 `correction-worker.js`가 빠지면 안 됩니다. `main`에 푸시한 변경이 자동 배포됩니다. 테스트와 `tools` 폴더는 배포하지 않아도 됩니다.

이 코드 자체에는 로그인 기능이 없습니다. 공개 호스팅하면 학생은 계정 없이 링크로 접속합니다. 기존 ChatGPT 사이트의 접근 제한은 별도 호스팅에 이전되지 않습니다. PWA 오프라인 캐시는 아직 포함되지 않았습니다.

## 버전

프로젝트 버전: 0.0.1

기반 배포 버전: 7

원본 Git 커밋: `8dae1dcbd61c9acd228533eb73e37e6c550b56de`

앱 코드는 원본 그대로이며 실행 도구와 이 안내를 추가했습니다. 기존 서비스의 프로젝트 설정·인증 정보·Git 내부 기록은 제외했습니다.
