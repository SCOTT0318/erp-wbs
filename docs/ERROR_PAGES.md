# TempChain 공통 오류 페이지

저장소 루트의 `tempchain-erp-error-pages/`에 400~408 및 500~505의 HTML 15개, 공통 오류용 `default.html`과 목록용 `index.html`이 있습니다. 기존 로그인 화면의 파랑·초록 배경, TEMPCHAIN 로고, 흰색 카드 구성을 사용하며 작은 화면에서는 카드를 중앙에 배치합니다.

## Web Station 적용

1. NAS에 `tempchain-erp-error-pages` 폴더가 동기화됐는지 확인합니다. 프로젝트 폴더가 `/volume1/docker`이면 예상 위치는 `/volume1/docker-error-pages`입니다.
2. Web Station의 오류 페이지 설정에서 **기본 오류 페이지 프로필**을 편집합니다. 상단 기본 응답 유형을 **정적 파일의 콘텐츠 삽입**으로 선택하고 폴더 버튼으로 `default.html`을 지정합니다. 이 파일은 개별 등록이 없는 오류에 사용하며 특정 상태 번호를 표시하지 않습니다.
3. 사용자 지정 응답에 필요한 오류 코드를 추가하고 해당 HTML을 연결합니다(예: 404 → `404.html`, 502 → `502.html`). `default.html`과 미리보기용 `index.html`은 이 코드 목록에 추가하지 않습니다. 파일은 폴더 버튼으로 선택합니다.
4. 이 프로필을 사용할 웹 서비스 포털의 연결 설정을 확인합니다. 지원 코드와 연결 방식은 서버 종류 및 DSM 버전에 따라 달라질 수 있습니다.
5. 적용한 포털의 존재하지 않는 주소에서 404 디자인과 개발자 도구의 HTTP 상태를 확인합니다. 장애 확인을 위해 운영 서버를 중지할 필요는 없습니다.

프로필 적용 및 NAS 실응답 검증은 아직 수행하지 않았습니다. [Synology 공식 오류 페이지 안내](https://kb.synology.com/en-global/DSM/help/WebStation/application_webserv_errorpage?version=7)를 참고하세요.

## 파일 특성

- 2026-09-16: 모든 상태 코드 페이지와 `default.html`에서 하단의 공통 관리자 문의·발생 시각 안내를 제거했습니다. 생성 스크립트에도 반영했으며 오류별 본문 설명은 유지합니다.

- CSS와 PNG 로고가 각 HTML 내부에 포함되어 외부 이미지, 폰트, JavaScript, CDN이나 실행 중인 ERP 앱이 필요하지 않습니다.
- 원래 요청 주소가 하위 경로여도 이미지 상대 경로 문제 없이 표시됩니다.
- 기본 프로필 공용으로 사용할 수 있도록 ERP 문구와 홈·로그인 이동 버튼을 제거했습니다. 회사 로고와 내장 PNG 파비콘을 유지합니다.
- 마스터가 지정한 15개 코드만 제공하며 실제 Web Station에서 지원하는 코드만 연결합니다. [IANA 코드 목록](https://www.iana.org/assignments/http-status-codes)을 기준으로 작성했습니다.
- HTML은 응답 본문입니다. 실제 오류 상태 코드는 웹 서버가 반환해야 하며, 파일 자체를 정상 URL로 열면 오류 상태가 발생하는 것은 아닙니다.
- ERP 내부 API의 JSON 오류나 앱 내부 알림이 자동으로 이 페이지로 바뀌지는 않습니다. API 응답을 HTML로 일괄 변환하지 마세요.

## 미리보기와 재생성

파일 탐색기에서 `tempchain-erp-error-pages/index.html`을 브라우저로 열고 원하는 코드를 선택합니다.

저장소 루트에서:

```powershell
conda run -n scott python erp/scripts/generate-error-pages.py
```

원본 로고는 `erp/apps/web/public/ico/logo`를 사용하며 재생성하면 해당 폴더의 HTML이 갱신됩니다. 문구와 디자인 변경은 생성 스크립트에 반영하세요.
