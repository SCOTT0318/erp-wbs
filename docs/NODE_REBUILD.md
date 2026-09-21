## 2026-09-17 검색 인덱스 업데이트
현재 스키마는 v9입니다. API 시작 시 검색 함수·인덱스를 추가하며 업무 테이블의 열 구조는 v8과 같습니다. 기존 서명된 v8 백업과 v9 백업은 검증 후 원자적으로 복원하며 v8 복원 시 v9 인덱스를 다시 생성합니다. [업무 공간 변경 안내](WORKSPACE_SEARCH_CALENDAR.md)를 참고하세요.

# Vue · Node · PostgreSQL 개발 안내

Windows/PowerShell + Miniconda **scott**, Node.js 24 이상을 사용하며 프로젝트 경로는 `D:\SynologyDrive\docker\erp`입니다. 현재 상태는 [AI 인수인계](AI_HANDOFF.md), 날짜별 실행 결과는 [검증 기록](VALIDATION.md), 배포 절차는 [NAS 안내](NAS_POSTGRES_SETUP.md)에서 관리합니다.

## 구조

### 로컬 DSM 직접 조회

`apps/api/.env`에 `ERP_NAS_DIRECTORY_SOURCE=dsm`, `ERP_NAS_DIRECTORY_LOGIN_ID`, `ERP_NAS_DIRECTORY_PASSWORD`를 설정합니다. 후자 두 값은 별도 조회 계정이며 서버 시작/수동 전체 조회와 일반 사용자의 메타데이터 조회에 사용합니다. 사용자의 로그인 비밀번호를 조회 계정으로 저장하지 않습니다. 환경 변수 변경 후 마스터가 API를 재시작해야 하며, 기존 bridge 키/URL은 dsm 모드에서 사용하지 않으므로 보존해도 됩니다. 예시는 `apps/api/.env.example`, 원본 설계는 [DSM 매뉴얼](SYNOLOGY_DSM_WEB_LOGIN_MANUAL.md)을 참고합니다.

| 경로 | 역할 |
|---|---|
| `apps/web` | Vue 3·Router·TypeScript·Vite, 로그인/관리자/부서 업무와 회사 로고 |
| `apps/api` | Fastify·TypeScript·pg, 세션·Origin/권한 검사·감사 기록 |
| `services/nas-directory` | 외부 npm 의존성 없는 읽기 전용 계정 스냅샷 서버·exporter |
| `scripts` | 개발 실행·감시, NAS 준비/진단/백업, PostgreSQL 테스트와 Docker 격리 검증 |
| `deploy/nas` | Nginx 설정과 비공개 컨테이너 환경 파일 |

## 명령과 개발 포트

로컬 PostgreSQL은 Docker Desktop의 `tempchain-erp-test`(PostgreSQL 18.6), `127.0.0.1:5433`, DB/사용자 `tempchain_erp_test`, 전용 볼륨 `tempchain-erp-test-data`입니다. `apps/api/.env`는 이 테스트 DB로 연결하며 실제 암호와 초기 관리자 암호는 이 비공개 파일에만 보관합니다. 현재 저장소에는 추적된 `.env.example`이 없습니다. NAS 운영 DB는 NAS의 별도 컨테이너이며 호스트 포트는 5433, 컨테이너 내부 포트는 5432입니다.

`npm run nas:prepare`는 로컬 `.env`를 수정하지 않으며 NAS DB 자격 증명은 직접 생성한 운영 DB와 일치하도록 별도로 준비해야 합니다. 기존 NAS 인증 설정은 유지하므로 NAS 비밀번호 변경은 실제 NAS에 반영됩니다. 개발 서버가 이미 실행 중이면 마스터가 재시작해야 변경한 `.env`가 적용됩니다.

```powershell
conda run -n scott npm ci
conda run -n scott --no-capture-output npm run dev
conda run -n scott npm run build
conda run -n scott npm run lint
conda run -n scott npm test
docker compose -f ../compose.yaml config --quiet
docker compose -f ../compose.yaml build
conda run -n scott --no-capture-output npm run docker:verify
```

마스터가 개발 서버를 직접 실행합니다. `dev:api`·`dev:web`으로 분리 실행할 수도 있으며 기본 API **8010**, Vue **5174**입니다. `dev`와 `dev:web`은 `scripts/dev-config.ts`에서 환경 값을 읽고 다른 포트로 자동 이동하지 않습니다.

기존 6174 덮어쓰기는 제거됐습니다. 마지막 Windows 진단에서는 동적 TCP 범위가 1024~15000이고 5141~5240이 예약되어 5174 bind가 거부됐으며, `scripts/repair-dev-port.ps1`은 관리자 실행용으로 준비만 됐습니다. 이 스크립트는 기본 동적 범위 49152~65535 복원·WinNAT 재시작·bind 검사를 하므로 로컬 Docker/WSL 네트워크가 일시 중단될 수 있고 개발 서버는 실행하지 않습니다.

개발 감시는 소스 내용 변화만 반영하고 동기화 메타데이터/DB 파일 변경을 무시합니다. 환경 파일을 수정한 뒤에는 마스터의 기존 터미널에서 Ctrl+C로 종료하고 재실행합니다.

## 환경 변수

새 설치는 이 문서의 변수 표와 `apps/api/src/config.ts`, `apps/api/src/nas-dsm-config.ts`의 검증 규칙을 참고합니다. 실제 환경 파일·조회 키·DB 비밀번호는 커밋하지 않습니다.

| 변수 | 용도 |
|---|---|
| `ERP_DATABASE_URL` | PostgreSQL 접속 URL, 필수 |
| `ERP_DATABASE_SCHEMA` | ERP 스키마, 기본 `public` |
| `ERP_NODE_HOST` / `ERP_NODE_PORT` | API 리슨 주소/포트 |
| `ERP_NODE_ORIGINS` | 쉼표로 구분한 정확한 허용 Origin |
| `ERP_NODE_COOKIE_SECURE` | 운영은 `true`, HTTPS 필수 |
| `ERP_NODE_ADMIN_LOGIN_ID` / `ERP_NODE_ADMIN_PASSWORD` | 빈 DB의 최초 로컬 관리자, 암호 12~128자 또는 명시한 `admin` / `admin` 조합; 기존 계정 암호·활성 상태는 유지 |
| `ERP_DEV_WEB_PORT` | `dev`·`dev:web` Vue 포트, 기본 5174 |
| `ERP_NAS_*` | [NAS 인증 안내](NAS_AUTH.md)와 환경 예시 참고 |
| `ERP_BACKUP_DIRECTORY` | 백업 저장소; 로컬 기본은 공란으로 비활성화 |
| `ERP_BACKUP_HOURLY` | 매시간 자동 백업; NAS Compose는 `true` |
| `ERP_TEST_DATABASE_URL` | 선택적인 별도 테스트 DB, 운영 접속 URL을 사용하지 않음 |

로컬 API와 NAS API는 별도 PostgreSQL DB를 사용합니다. NAS 인증은 별도 설정이므로 로컬 화면에서도 NAS 비밀번호 변경은 실제 NAS 계정에 반영됩니다. `ERP_NODE_DATABASE`는 폐기했으며 SQLite를 자동 이관하지 않고, 환경변수 변경으로 기존 관리자/DB 사용자 비밀번호를 재설정하지 않습니다.

## DB와 업무 계약

- 표식 `tempchain-postgres-v1`과 스키마 버전 **1~8**을 검사합니다. 마이그레이션은 원자적이며 다른 앱의 스키마나 더 최신 DB는 거부합니다. NAS v7은 2026-09-15 읽기 전용 점검에서 확인했으며 현재 상태를 다시 조회한 결과는 아닙니다.
- v5는 NAS 설명→이름, 단일 일치 활성 NAS 그룹→부서, 관리자 직급·사번을 도입했습니다. 로그인은 직급·사번을 보존하고 NAS 이메일이 비어 있으면 ERP 이메일도 보존합니다.
- v6는 거래처 담당 부서·등록/수정자·삭제 기록을 추가합니다. 사업부·기술개발부는 자기 부서 거래처만 등록/수정하고 관리자만 부서 배정·사용 중지·삭제할 수 있습니다. 기존 부서는 추측하지 않으며 동시 변경은 버전과 행 잠금으로 보호합니다.
- Pool 트랜잭션은 한 연결을 사용하며 스키마별 advisory lock으로 변경을 직렬화합니다. 큰 정수 안전 범위를 검사하고 자재 수량은 1,000배 정수로 처리합니다.
- 생산 업무 규칙과 미구현 범위는 [PRODUCTION.md](PRODUCTION.md)를 따릅니다.

## 공통 선택 UI와 비밀번호

데스크톱 사이드바는 기본 접힘 상태에서 호버/키보드 포커스로 본문 위에 펼쳐집니다. 별도 접기 버튼·화살표 박스는 없고 모바일은 기존 터치 메뉴를 사용합니다. 관리자·생산부 각 그룹의 메뉴 아이콘을 구분하며 부서가 다르면 같은 아이콘을 사용할 수 있습니다.

공통 사이드바 하단은 계정 역할 대신 브라우저 로컬 현재 날짜를 `YYYY. MM. DD. (요일)`로 표시합니다. 로컬 자정에 갱신하고 탭 복귀·포커스 시 다시 확인하며, `<time>`의 날짜 값·접근 가능한 이름과 접힌 메뉴 툴팁을 유지합니다.

선택 필드는 `AppSelect.vue`의 option 슬롯·v-model·change 처리를 사용합니다. body Teleport 팝업은 화면 위치에 따라 위/아래로 열리고 숫자 ID·null 미지정·required·disabled 및 키보드 탐색을 보존합니다. `JobTitleSelect.vue`도 이를 감싸며 기본 회사 직급 13개는 `UsersView.vue`의 `defaultJobTitles`에서 관리하고 기존 저장된 직급을 추가 선택지로 유지합니다.

본인 비밀번호 화면은 길이·현재값과 차이·확인값 일치를 표시합니다. `/api/auth/password/check`는 인증된 본인만 분당 10회 사용할 수 있고 세션·CSRF·credential lock·동일 NAS UID를 확인하며 비밀번호나 세션을 변경하지 않습니다. 로컬은 입력 중단 800ms 후 확인, NAS는 OTP 소비·실패 누적을 고려해 명시 버튼을 사용하고 늦은 응답을 무시합니다.

로컬 새 비밀번호는 12~128자입니다. NAS UI는 2026-09-15 DSM에서 확인한 최소 6자·숫자 포함·사용자 이름/설명 제외를 안내하며 최종 정책 판정은 DSM에 위임합니다. 이 안내는 자동 동기화되지 않으며 실제 변경 API는 항상 재인증합니다.

## 백업과 NAS 도구

| 명령/파일 | 용도와 적용 범위 |
|---|---|
| `conda run -n scott npm run nas:prepare` | 비공개 설정 준비; 기존 키·자격 증명 보존 |
| `conda run -n scott --no-capture-output node scripts/audit-nas.mjs` | 환경/키 일치, 파일 동기화, 계정 소스 구조와 HTTPS 응답 읽기 전용 진단 |
| `conda run -n scott --no-capture-output npm run nas:backup` | 과거 전체 DB 덤프·복원 검증 도구. 현재 로컬 테스트 DB 설정에서는 주소 검사로 중단하므로 운영 DB 전용 설정 지원을 수정하기 전에는 사용하지 않음 |
| `conda run -n scott --no-capture-output node scripts/docker-verify.mjs --split` | 로컬 별도 프로젝트에서 앱/DB 분리 구성 검증 |
| `services/nas-directory/refresh-snapshot-host.sh` | NAS Node.js_v22와 기존 사용자 권한으로 매분 스냅샷 생성; 현재 DSM 예약 방식 |
| `scripts/rebuild-nas-app.sh` | `/volume1/docker`의 `tempchain-erp` 앱만 재빌드; 독립 DB 불변·health·실행 이미지 확인, 스크립트 실행 미확인 |

관리자 `/admin/backups`는 `apps/api/src/backups.ts`의 전체 PostgreSQL 덤프·시간별 백업·서명 업로드·재인증 복원을 제공합니다. NAS는 `/docker/erp-db/managed`를 `/backups`로 마운트하며 로컬 활성화에는 쓰기 가능한 경로와 PostgreSQL 18 클라이언트가 필요합니다. `.signing-key`·기존 백업을 보존하고 v7 이하/더 최신 스키마 또는 테이블 구성이 다른 백업의 직접 운영 복원을 차단합니다.

루트 `compose.yaml`과 `compose.app.yaml`은 동일한 앱 전용 구성입니다. 운영 DB는 직접 만든 `tempchain-erp-database`이며 `erp-db/compose.yaml`은 과거 구성과 격리 Docker 검증용으로만 보존합니다. [현재 독립 DB 안내](STANDALONE_DATABASE.md)를 따릅니다. `backup-nas-postgres.sh`도 이전 `erp-postgres` 이름을 사용하므로 현재 NAS에 예약하지 않습니다.

## 검증과 운영 확인

API 테스트는 운영 DB를 사용하지 않는 실제 임시 PostgreSQL에서 실행합니다. 동시 판매·중복 요청·마이그레이션 롤백·재시작 데이터 유지·인증 권한 경쟁을 검사하며 날짜별 개수/결과는 [검증 기록](VALIDATION.md)에만 기록합니다.

Docker 검증은 별도 DB·가짜 계정 목록을 사용하고 운영 NAS에 접근하지 않습니다. `--keep` 사용 시 `.staging/docker-verify-state.json`에 프로젝트/주소가 남고 해당 `compose.json` 옆 `stop` 파일을 만들면 정리 후 종료합니다. CPU CFS/NanoCPUs 제한은 지정하지 않으며 서비스의 실제 CPU 제한값 0을 검사합니다.

NAS의 2026-09-15 기록에는 Web Station 연결 복구, host exporter 계정 조회 200, 매분 예약 갱신, DSM 앱 재빌드와 HTTPS 최신 자산·health 200 확인이 있습니다. 실제 직원 로그인·OTP·비밀번호 변경과 백업 권한은 별도 확인이 필요하며 [인수인계](AI_HANDOFF.md)를 따릅니다.

### 관리자 대시보드와 부서 지정 (v7)

현재 v8은 프로필 PNG를 `users.avatar_image`에 저장합니다. 내 정보에서 5MB 이하 JPG/PNG/WebP 선택 후 미리보기를 확인하고 저장하면 상단 프로필에 적용됩니다. 브라우저는 256px 정사각형 PNG로 변환하며 API는 256KB/512px 한도로 검사합니다. 기본 이미지 버튼도 저장해야 반영됩니다. 사진은 전체 DB 백업에 포함되며 기존 v7 이하 백업의 직접 UI 복원은 차단됩니다.

`GET /api/admin/dashboard?month=YYYY-MM`은 관리자 전용 집계 API이며, `GET /api/auth/heartbeat`는 로그인한 세션의 활동 시각만 갱신합니다. 접속 인원은 최근 5분간 유효 세션이 활동한 고유 계정 수입니다. CPU는 API 프로세스의 1코어 기준(100% 초과 가능), 요청·오류·평균 지연은 최근 1분 집계이며 NAS 전체 상태를 의미하지 않습니다.

관리자가 명시 저장한 부서는 `department_managed=1`로 NAS 재로그인에서도 보존합니다. 단, NAS 설명이 `이름 | CEO` 또는 `이름 | CTO`이면 사용자 요청에 따라 경영진 부서와 해당 영문 직급을 우선 반영합니다. 본인 부서 변경은 현재 세션과 화면의 계정 정보를 유지하며, 다른 세션은 해제합니다. DB v8 이전 백업은 별도 마이그레이션이 필요합니다.

계정 등록 UI/API는 제거되었습니다. NAS에서 계정을 생성하고 관리자 페이지의 **NAS 계정 가져오기**를 누르면 재시작 없이 가져오며, 기존 계정 수정은 모달로 제공합니다. DSM의 다음 로그인 시 비밀번호 변경 요구는 ERP 로그인에서 현재 비밀번호와 새 비밀번호를 입력해 처리합니다.

내 정보의 NAS OTP 입력란은 기본 숨김이며 NAS가 추가 인증을 요구한 경우에만 표시합니다. OTP 미사용 계정은 현재 비밀번호 확인과 새 비밀번호 입력만으로 진행합니다.

### 업무 홈

`GET /api/work/dashboard?date=YYYY-MM-DD`는 인증된 사용자의 현재 권한으로 업무 현황을 집계합니다. 생산부 공유 납기는 빠른 순 최대 8건, 선택한 7일 내 하루별 최대 5건이며 집계 건수는 전체 대상입니다. 거래처는 활성 사업부/기술개발부 접근 범위별로 반환하고 개인 활동은 actor_id로 제한합니다. 브라우저 로컬 날짜를 기준으로 60초마다 보이는 탭에서 갱신하며 미등록 데이터는 빈 상태로 표시합니다.

관리자 접속 목록: `/admin/online-users` → `GET /api/admin/online-users`. 관리자 홈 카드와 동일한 최근 5분 기준으로 계정별 집계하며, 여러 로그인 세션은 한 행에 합칩니다. 탭 종료는 즉시 감지하지 않으므로 최대 5분 동안 표시될 수 있습니다.

업무 부서 선택은 `workspace.ts`의 공유 보기 상태입니다. 본인 부서를 기본으로 하고, 기존 부서별 거래처/생산 조회 권한과 활성 부서에 따라 목록을 구성합니다. `workspace-options.ts`의 기본 선택·허용 목록을 `scripts/workspace.test.mjs`로 검증합니다. 실제 소속 변경은 기존 관리자 계정 관리 API를 사용합니다.

NAS 설명을 `이름 | 직급` 형식으로 입력하면 일반 직원의 이름·직급도 시작/수동 동기화와 로그인에서 갱신됩니다. 직급 없는 설명은 기존 직급을 유지하며 CEO·CTO 이외의 직급은 부서를 변경하지 않습니다.
