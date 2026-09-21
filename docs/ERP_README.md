# TempChain ERP

Vue 3·TypeScript + Node.js·Fastify + PostgreSQL 기반 ERP입니다. 인증·계정/부서 관리·관리자/업무 홈·접속 인원·거래처·생산·백업을 제공하며 기존 파랑·초록 디자인과 회사 로고를 유지합니다.

소스는 [docker 저장소](/home/tempchian-1/tempchain/docker/README.md)의 `master`에서 관리합니다. 실제 환경 파일·DB·백업·키는 로컬에 보존하고 루트 `.gitignore`에서 제외합니다.

## 구현 범위

- 로컬/NAS 인증, 본인 정보·비밀번호 변경, 관리자 계정·부서·거래처·서명 백업 관리.
- 업무 부서 선택과 권한별 업무 홈, 관리자 홈과 최근 5분 활동 기준 접속 인원 목록.
- 사업부/기술개발부 거래처, 생산 자재/재고·개체별 컨테이너·소형 제품 판매·생산지시/실적.
- 금융·회계는 구축 범위에서 제외합니다. 향후 기능은 생산부 → 사업부 → 기술개발부 순서의 회의와 요구사항 확인 뒤 확정하며, 현재 생산 계약은 [생산 안내](PRODUCTION.md), 진행 기준은 [인수인계](AI_HANDOFF.md)를 따릅니다.

## 로컬 개발과 DB

`D:\SynologyDrive\docker\erp`에서 Windows/PowerShell + Miniconda **scott**, Node.js 24 이상을 사용합니다.

```powershell
conda run -n scott npm ci
conda run -n scott --no-capture-output npm run dev
```

마스터가 개발 서버를 직접 실행합니다. API 기본 **8010**, Vue 기본 **5174**이며 `dev:api`·`dev:web`으로 분리 실행할 수 있습니다. `dev`와 `dev:web`은 같은 포트 설정을 사용하고 자동으로 다른 포트로 옮기지 않습니다.

로컬 API는 Docker Desktop의 `tempchain-erp-test`, `127.0.0.1:5433/tempchain_erp_test`와 전용 볼륨 `tempchain-erp-test-data`를 사용합니다. `apps/api/.env`는 비공개이며 NAS 운영 설정과 분리합니다. 현재 추적된 `.env.example`은 없으므로 새 설치 변수는 [개발 안내](NODE_REBUILD.md)의 변수 표와 API 설정 검증을 기준으로 작성합니다.

`ERP_DATABASE_URL`은 필수이며 `ERP_DATABASE_SCHEMA` 기본값은 `public`입니다. 빈 DB의 첫 관리자 ID는 기본 `admin`, 초기 암호는 12~128자의 `ERP_NODE_ADMIN_PASSWORD`가 필요합니다. 기본 암호는 없고 환경변수 변경으로 기존 암호가 재설정되지 않습니다.

개발 감시는 API 소스 내용 변경을 반영하고 동기화 메타데이터/DB 파일 변경은 무시합니다. 환경 파일 수정 후 재시작은 마스터가 수행하며 포트 예약 문제와 관리자 복구 스크립트는 [개발 안내](NODE_REBUILD.md#명령과-개발-포트)를 참고합니다.

## NAS 운영

[현재 독립 DB 안내](STANDALONE_DATABASE.md)를 따릅니다. 루트 `compose.yaml`과 `compose.app.yaml`은 같은 **tempchain-erp** 앱 전용 프로젝트이며 NAS `/docker`에서 `api`·`web`만 실행합니다. 이전 `directory` 코드는 비활성 이력으로 보존하며 운영 인증에는 사용하지 않습니다.

운영 DB는 공식 이미지로 직접 만든 **tempchain-erp-database**이며 `/docker/erp-db/data`를 `/var/lib/postgresql`에 연결합니다. API는 외부 `erp-database` 네트워크의 `tempchain-erp-database:5432/tempchain_erp`에 접속하고 NAS 외부 DB 포트는 5433입니다. `erp-db/compose.yaml`은 과거 구성 보존용으로 현재 운영 DB에 사용하지 않습니다.

NAS Compose는 비공개 `deploy/nas/api.env`만 읽으며 로컬 `apps/api/.env`를 사용하지 않습니다. NAS 계정 인증 연결은 DB 분리와 별개이므로 로컬 테스트 화면의 NAS 비밀번호 변경도 실제 NAS에 반영됩니다.

마지막 배포 기록은 **2026-09-16**의 DSM 앱 재빌드·API healthy·웹 시작과 DSM 직접 계정 조회 반영입니다. 실제 직원 로그인·OTP·비밀번호 변경, NAS 백업 권한 해결·자동 백업은 별도 미검증이며 [검증 기록](VALIDATION.md)과 [인수인계](AI_HANDOFF.md)에 구분했습니다.

기존 `nas:backup` 명령과 `scripts/backup-nas-postgres.sh`는 이전 DB 주소/컨테이너에 의존하는 보존 도구이며 현재 독립 운영 DB용으로 검증하기 전에는 실행하지 않습니다.

## 검증

`erp/`에서 실행합니다.

```powershell
conda run -n scott npm run build
conda run -n scott npm run lint
conda run -n scott npm test
```

Docker Compose 해석 검사는 저장소 루트에서 `docker compose -f compose.yaml config --quiet`로 실행합니다. 빌드는 API TypeScript·Vue 타입 검사를 포함하며 API 테스트는 운영 DB와 분리한 임시 PostgreSQL에서 수행합니다.

테스트는 인증/권한·마이그레이션·동시 판매·중복 요청·재시작과 NAS 모의 인증 등을 검사합니다. 날짜별 테스트 개수·브라우저 검증·Docker 실행 결과는 [검증 기록](VALIDATION.md)에 보관하며 과거 성공을 현재 환경의 새 검증으로 표시하지 않습니다.

2026-09-16 미사용 파일·코드/CSS와 중첩 `.gitignore` 정리 후 빌드·린트·전체 테스트를 통과했습니다. 로컬 5174 응답이 없어 이번 브라우저 검증은 수행하지 않았습니다.

## 관련 문서

- [현재 상태와 AI 인수인계](AI_HANDOFF.md)
- [Windows 개발 안내](NODE_REBUILD.md)
- [독립 운영 DB](STANDALONE_DATABASE.md)
- [NAS 설치·장애 대응 이력](NAS_POSTGRES_SETUP.md)
- [NAS 인증](NAS_AUTH.md)
- [DB 및 백업](DATABASE_README.md)
- [문서 목록](README.md)
