# NAS 계정 연동

## 2026-09-16 로컬 최신 방식: DSM 직접 조회

마스터의 [DSM 매뉴얼](SYNOLOGY_DSM_WEB_LOGIN_MANUAL.md)에 따라 로컬은 `ERP_NAS_DIRECTORY_SOURCE=dsm`을 사용합니다. API 시작/관리자 수동 요청은 `ERP_NAS_DIRECTORY_LOGIN_ID`·`ERP_NAS_DIRECTORY_PASSWORD`의 전용 조회 계정으로 사용자·그룹·구성원을 읽고, 로그인은 본인의 DSM 인증 후 이름·이메일·그룹을 다시 확인합니다. 본인 조회 권한 부족만 조회 계정으로 대체하며 인증 실패·확정된 그룹 거부는 우회하지 않습니다.

시작 조회는 API 지원 확인, 페이지 단위 조회, UID/중복/전체 페이지 완결 검증, 허용 그룹 필터, 세션 로그아웃을 수행합니다. `X-SYNO-TOKEN` 헤더와 User.list `additional`의 `uid`는 실제 NAS에서 확인했습니다. NAS 비밀번호는 ERP DB에 저장하지 않습니다. 원본 매뉴얼의 Python 예제는 참고이며 구현은 기존 Node.js/Fastify를 유지합니다.

직접 조회는 작업 스케줄러·180초 스냅샷과 무관하고 자동 반복 조회도 없습니다. 조회 계정 미설정/장애 시 시작 동기화는 실패 상태로 남지만 로컬 ERP 로그인은 유지합니다. NAS 운영 앱 설정·배포는 변경하지 않았으므로 아래 bridge 설명은 기존 운영 구성에 해당합니다.

현재 배포 설정은 [독립 운영 DB](STANDALONE_DATABASE.md)와 [NAS 설치 안내](NAS_POSTGRES_SETUP.md)를 따릅니다. SSO/OIDC나 이전 bridge 스냅샷이 아니라 본인 DSM 인증과 전용 조회 계정의 DSM 직접 조회를 사용합니다.

## 인증과 관리자

직원이 ERP에 입력한 NAS 아이디·비밀번호·선택 OTP로 DSM Auth API에 인증합니다. 성공한 계정명만 HTTPS bridge에 보내 UID·그룹·설명을 확인합니다. bridge 구성은 API 시작 시와 관리자 수동 요청 시 `POST /v1/directory`로 erp 또는 administrators 구성원을 미리 등록하므로 직원의 첫 로그인 전에도 관리자 목록에 표시합니다. 로그인 때도 다시 인증·동기화하며, 공유 키가 없는 목록 조회는 거부합니다.

administrators 그룹은 ERP admin 역할로 로그인마다 동기화하고 역할이 바뀌면 기존 ERP 세션을 폐기합니다. NAS 설명은 이름으로 반영하며, NAS 그룹명과 정확히 일치하는 활성 ERP 부서가 하나이면 배정하고 여러 개이거나 없으면 부서를 미지정으로 처리합니다. 부서 권한 변경 시 기존 세션을 폐기하며, 기존 로컬 계정과 같은 아이디는 자동 연결하지 않고 UID가 달라진 재생성 계정의 권한 승계도 차단합니다.

직급과 사번은 관리자가 입력하며 NAS 로그인으로 덮어쓰지 않습니다. NAS 이메일이 있으면 동기화하고 비어 있으면 기존 ERP 이메일을 보존합니다. v5 이관은 이전 NAS 동기화 직급을 이름으로 옮기고 직급을 비우며, 운영 적용 여부는 아직 확인하지 않았습니다.

## 최소 권한과 비밀번호

ERP의 전체 목록 자동 반복 조회는 없습니다. 관리자의 ‘NAS 계정 가져오기’는 `POST /api/admin/nas-sync`로 실행하며 동시 요청을 하나로 합치고 분당 2회로 제한합니다. 일반 ‘새로고침’은 ERP 목록만 다시 읽습니다. NAS 호스트의 매분 스냅샷 생성은 로그인 시 그룹 검증의 180초 유효기간 때문에 별도로 유지하며, 두 주기는 서로 다릅니다.

현재 bridge 구성에는 공유 DSM 조회 계정이 필요하지 않습니다. ERP_NAS_DIRECTORY_LOGIN_ID/PASSWORD는 공란입니다. 조회 서버는 NAS 계정 생성·삭제·수정·비밀번호 변경 기능, Docker 소켓, 비밀번호 파일을 갖지 않습니다. 기존 dsm 모드 호환 코드는 남아 있지만 현재 배포 설정에서 사용하지 않습니다.

비밀번호 변경은 현재 비밀번호/OTP로 다시 인증하고 본인 DSM 세션의 NormalUser.set을 호출합니다. DB에 NAS 비밀번호를 저장하지 않으며 원격 변경 직전 모든 ERP 세션을 폐기합니다. 응답이 유실되어 변경 여부가 불명확해도 기존 ERP 세션을 살려두지 않습니다.

최초·만료 비밀번호는 로그인 실패 코드 409/410일 때 ERP 로그인 카드에서 변경합니다. `POST /api/auth/nas/expired-password`가 현재 비밀번호/OTP와 DSM 변경 필요 상태를 다시 확인한 뒤 `SYNO.API.Auth.reset` v6 (`account`, `passwd`, `new_passwd`, `session=webui`)을 호출합니다. 이는 2026-09-16 실제 DSM 공개 `changePwdPage` 소스에서 확인한 계약이며, 408(변경 불허)은 우회하지 않습니다. 성공 또는 결과 불명확 시 기존 ERP 세션을 폐기하고 새 로그인 전까지 ERP 세션을 발급하지 않습니다. 실제 직원 비밀번호 변경은 아직 검증하지 않았습니다.

2026-09-15 DSM에서 확인한 NAS 기준은 최소 6자·숫자 포함·사용자 이름/설명 제외이며 대소문자 혼합·특수문자는 필수가 아닙니다. 화면 안내는 자동 동기화되지 않고 최종 검증은 DSM에 위임합니다. 로컬 ERP 비밀번호는 12~128자이며, NAS 현재 비밀번호 사전 확인은 명시 버튼을 사용하고 OTP 사용 시 실제 변경에 새 코드를 입력합니다.

직원 자신의 DSM 인증 권한은 필요합니다. DSM 접근을 모두 거부한 직원을 직접 인증하는 구성은 지원하지 않습니다. NAS 로컬 사용자/OTP를 지원하며 AD·LDAP·패스키 전용·Secure SignIn 승인 방식은 범위 밖입니다.

## 현재 설정

| 변수 | 값/의미 |
|---|---|
| ERP_NAS_ENABLED | true |
| ERP_NAS_URL | https://tempchain.myds.me:3300 |
| ERP_NAS_CONNECT_ADDRESS | 192.168.0.7, 인증서 호스트 검증 유지 |
| ERP_NAS_ALLOWED_GROUP | erp; administrators는 관리자 예외 |
| ERP_NAS_DIRECTORY_SOURCE | bridge |
| ERP_NAS_DIRECTORY_URL | https://tempchain.myds.me |
| ERP_NAS_DIRECTORY_CONNECT_ADDRESS | 192.168.0.7 |
| ERP_NAS_DIRECTORY_KEY | 파일과 API에 동일하게 저장된 256비트 전용 키 |
| ERP_NAS_TIMEOUT_MS / ERP_NAS_SESSION_MINUTES | 10000 / 60 |

NAS 스냅샷은 매분 갱신하며 180초를 넘으면 거부합니다. 가져온 계정의 역할·자동 부서 변경은 기존 ERP 세션을 폐기합니다. 목록에서 사라진 계정을 자동 삭제/비활성화하지 않으며 다음 로그인에서 그룹을 재검증하고 기존 NAS 세션의 고정 만료는 기본 60분입니다.

host exporter는 `/usr/syno/sbin/synouser --get 계정`의 계정명·UID 일치를 확인한 `User Mail`만 선택 수집합니다. 명령은 셸 없이 고정 경로·인수로 실행하며 원문을 저장/출력하지 않습니다. NAS 작업 사용자의 읽기 권한이나 출력 형식이 맞지 않으면 이메일 조회 경고를 남기고 기존 ERP 이메일은 유지합니다. 실제 host 조회 권한은 아직 미검증이며 일반 container exporter에는 이 보강이 없습니다. 인증된 본인의 NormalUser.get도 로그인 시 이메일을 보강합니다.

2026-09-16의 조회 HTTP 503와 갱신 작업 오류 127은 bridge 경로의 과거 진단입니다. 이후 운영은 DSM 직접 조회로 전환됐으므로 스냅샷 갱신을 현재 로그인 의존성으로 복구하지 않습니다. 관리자 화면은 동기화 실패와 마지막 성공 시간을 표시하며 장애가 있어도 기존 목록·로컬 로그인을 유지합니다. 날짜별 모의/실환경 결과는 [검증 기록](VALIDATION.md)을 따릅니다.

### v7 부서 수동 지정 우선 정책

관리자가 ERP에서 부서를 명시 저장한 계정(`department_managed=1`)은 미지정(null)을 포함해 NAS 로그인 시 그 부서를 유지합니다. 이 값이 0인 기존/자동 생성 계정에만 위의 NAS 그룹 부서 동기화 규칙을 적용합니다. 본인 부서 변경은 현재 ERP 세션을 유지하고 다른 세션을 폐기하며, NAS 자격과 administrators 역할 검증은 그대로 적용합니다.
