# NAS 전체 ERP + PostgreSQL 설치

## 최신 인증 배포 기준 — 2026-09-16

운영 인증은 [DSM 연동 매뉴얼](SYNOLOGY_DSM_WEB_LOGIN_MANUAL.md)의 직접 조회 방식입니다. `erp/deploy/nas/api.env`의 `ERP_NAS_DIRECTORY_SOURCE=dsm`과 기존 전용 조회 계정 설정을 사용하며 Compose는 api/web만 배포합니다. directory 스냅샷·갱신 예약은 로그인에 필요하지 않습니다.

실제 DSM 프로젝트 이름은 `tempchian-erp`입니다. 이전 directory 컨테이너는 중지 상태로 보존했으며 DSM의 프로젝트 전체 시작이 orphan을 다시 시작할 수 있습니다. 아래 과거 bridge 설치 절차는 현재 운영에 적용하지 않습니다.


## 2026-09-16 폴더 이동 후 적용 기준

현재 앱 전용 배포는 [독립 DB 안내](STANDALONE_DATABASE.md)를 따릅니다. 아래 이전 날짜의 경로·통합 DB 명령은 당시 기록이며 새 배치에 그대로 실행하지 않습니다.

| 항목 | 새 배치 경로 |
| --- | --- |
| Container Manager 앱 프로젝트 | `/docker` |
| NAS 저장소 루트 | `/volume1/docker` |
| 앱 환경 파일 | `/volume1/docker/erp/deploy/nas/api.env` |
| 백업·서명 키 | `/volume1/docker/erp-db/managed` |
| 운영 DB 데이터 배치 목표 | `/volume1/docker/erp-db/data` |
| 로컬 개발 | `D:\SynologyDrive\docker\erp` |

기존 bridge 예약 작업이 유지되는 경우 명령 경로는 `/bin/sh /volume1/docker/erp/services/nas-directory/refresh-snapshot-host.sh`입니다. 앱 재빌드 스크립트는 `/volume1/docker/erp/scripts/rebuild-nas-app.sh`입니다.

이번 변경은 파일만 수정했으며 NAS 프로젝트·DB 마운트·예약 작업을 변경하거나 서비스를 재시작하지 않았습니다. 폴더 이동은 컨테이너 마운트를 자동 갱신하지 않으므로 기존 데이터 및 `.signing-key`와 마운트의 일치를 먼저 확인하고, 빈 폴더로 DB를 초기화하지 않습니다.

## 이전 배포 기록

> 2026-09-15 로그인 목록 갱신 적용 완료: DSM 작업 `ERP directory refresh`는 scott0318 사용자로 매일 00:00~23:59 1분마다 `/bin/sh /volume1/docker/ERP/services/nas-directory/refresh-snapshot-host.sh`를 실행합니다. Node.js_v22 패키지를 사용하며 root/Docker 권한 없이 동작합니다. 아래 root/Docker exporter 예약 방식은 대안이므로 함께 중복 등록하지 않습니다.

> **2026-09-15 최신 변경:** 운영 DB는 직접 만든 컨테이너로 실행하며 루트 Compose는 앱 전용입니다. 아래 과거 통합 DB 분리 명령을 실행하지 말고 [현재 운영 DB 안내](STANDALONE_DATABASE.md)를 먼저 따르세요.

> **2026-09-16 정리:** 이 문서의 통합 `erp` 프로젝트·`erp-postgres`·외부 볼륨 전환 절차는 과거 기록입니다. 현재 `nas:backup`은 이전 `192.168.0.7:5432` 주소만 허용하고 셸 백업도 이전 컨테이너명을 사용하므로 새 운영 DB용으로 수정·검증하기 전에는 실행하거나 예약하지 않습니다. 로컬 `.env`를 운영 DB로 되돌려 우회하지 않습니다.

## DB 백업과 프로젝트 분리

### 관리자 페이지와 매시간 자동 백업 — 최신 구현

- 관리자 → **DB 백업 관리**에서 전체 백업 생성, 목록/용량/테이블·행 개수 확인, 다운로드, 업로드, 운영 DB 복원을 지원합니다. 관리 파일 위치는 `/volume1/docker/erp-db/managed`입니다.
- PostgreSQL `pg_dump --format=custom`으로 **ERP_DATABASE_URL이 가리키는 DB 전체**를 저장합니다. 모든 스키마의 테이블·데이터·인덱스·시퀀스·뷰·함수·대형 객체를 포함하며 업무 테이블을 골라 제외하지 않습니다. 동일 스냅샷의 테이블별 행 수를 함께 기록합니다. PostgreSQL 클러스터의 다른 DB·서버 역할/설정, NAS 직원 비밀번호, 환경 파일과 첨부 파일 같은 DB 외부 파일은 이 덤프에 포함되지 않습니다.
- NAS Compose의 API에 `ERP_BACKUP_DIRECTORY=/backups`, `ERP_BACKUP_HOURLY=true`가 설정되어 있습니다. API가 실행 중이면 정시 이후 1분 이내에 현재 시점 백업을 시작하고, 재시작 시 해당 시간대 백업이 없으면 생성합니다. 중단되어 있던 과거 시점의 데이터를 재구성하지는 않습니다. 기존 02:00 셸 예약 방식과 달리 관리자 화면용 백업은 API 내부에서 생성합니다.
- 파일은 스트리밍으로 업로드/다운로드하며 덤프 최대 크기는 1 GiB입니다. 성공 백업·실패한 `.partial-*` 파일을 자동 삭제하지 않습니다. 자동 백업 실패는 관리자 화면에 표시됩니다.
- 다운로드 형식은 `.erpbackup`(서명한 메타데이터 + 원본 PostgreSQL 덤프)입니다. 업로드 시 서버 서명·SHA256·크기·아카이브 목록을 검증하고, 업로드만으로 운영 DB를 변경하지 않습니다. 임의 SQL이나 서명 없는 `.dump`를 웹 복원에 실행하지 않습니다.
- `.signing-key`는 백업 진위 검증 키입니다. **managed 폴더 전체와 키를 함께 별도 보관**해야 서버 재설치 후에도 업로드·복원이 가능합니다. 키가 손상되거나 기존 백업이 있는데 키만 사라지면 자동 재생성하지 않습니다.
- 기존 복원 검증 백업 2개는 일회성 도구로 관리 형식에 등록 완료했으며 원본과 키를 보존했습니다. 완료된 `import-verified-backups.mjs`는 2026-09-16 정리에서 제거했습니다. 신규 외부 `.dump`를 임의로 서명하거나 승인하지 않습니다.

**NAS 최초 적용:** 동기화 완료 후 마스터가 SSH에서 아래 명령으로 **managed 폴더만** UID 1000 전용으로 준비합니다. 앞에서 생성된 기존 DB 볼륨이나 erp-db 루트의 이전 백업은 변경하지 않습니다.

```sh
sudo chown -R 1000:1000 /volume1/docker/erp-db/managed
sudo find /volume1/docker/erp-db/managed -type d -exec chmod 700 {} \;
sudo find /volume1/docker/erp-db/managed -type f -exec chmod 600 {} \;
```

현재 `scripts/rebuild-nas-app.sh`는 `/volume1/docker`의 앱 전용 `tempchain-erp` 프로젝트를 빌드·재생성하고 독립 DB 불변을 확인합니다. 스크립트 실행 기록과 DSM 수동 재빌드 기록은 구분합니다. API 이미지에는 PostgreSQL 18 클라이언트 도구가 포함됩니다. 백업 저장소가 읽기/쓰기 불가능하면 백업 기능만 사용 불가로 표시하며 기존 ERP 업무 API는 계속 동작합니다. Web Station 자체 업로드 제한도 큰 파일을 허용해야 합니다.

**복원 절차:** 백업 선택 → 생성 시각 확인 → `RESTORE <백업 ID>` 입력 → 현재 관리자 비밀번호(NAS 계정은 필요 시 OTP) → 사전 백업 후 복원입니다. 다른 요청이 진행 중이면 재시도를 안내하며, 복원 중에는 같은 DB를 사용하는 최신 API 인스턴스의 요청을 PostgreSQL 잠금으로 차단합니다. 복원 전 전체 백업이 실패하면 복원을 시작하지 않습니다. SQL 복원과 테이블별 행 수·ERP 표식·활성 관리자 검증을 하나의 트랜잭션으로 처리하여 검증 실패 시 롤백합니다. 성공하면 복원된 기존 세션을 만료시키고 감사 이력을 남깁니다. 현재와 테이블 구성이 다르거나 더 최신 스키마의 백업은 웹에서 복원하지 않습니다.

현재 UI 복원은 v7을 포함하고 더 최신 버전이 없는 호환 백업만 허용합니다. v6 이하 백업은 원본을 보존하고 별도 마이그레이션 절차를 사용합니다. 운영 복원 전 같은 DB에 직접 접속하는 별도 도구와 구버전 개발 API는 중지해야 합니다. 최신 API를 거치지 않는 외부 DB 연결까지 이 요청 차단 기능이 통제하지는 않습니다. DB 소유자·권한은 현재 접속 설정을 유지하고 데이터를 복원하며, 클러스터 전체 재해 복구는 별도 절차입니다. 기존 백업 키·환경 파일·DB 볼륨은 계속 보존합니다.

### 백업 위치와 검증

NAS `/volume1/docker/erp-db/erp-<시각>-<임의값>/`에 `database.dump`, `SHA256SUMS`, `manifest.json`을 보관합니다. 실제 DB 파일은 기존 `erp_postgres-data` 볼륨에 그대로 둡니다. 실행 중인 데이터 디렉터리를 복사하지 않고 일관된 PostgreSQL 덤프를 만듭니다.

Windows에서 실행하는 전체 복원 검증 백업:

```powershell
conda run -n scott --no-capture-output npm run nas:backup
```

운영 DB를 읽기 전용 스냅샷으로 덤프하고 네트워크 없는 로컬 임시 DB에 복원하여 테이블별 행 수와 ERP 표식을 비교한 뒤 NAS로 전송·해시 검증합니다. Docker Desktop과 NAS SSH 키 접속이 필요합니다. 로컬 사본은 `.staging/nas-backups`에 남고 기존 백업은 삭제하지 않습니다. 덤프는 해당 DB 대상이며 클러스터 역할·NAS 설정·환경 파일의 백업은 포함하지 않습니다.

별도 셸 백업이 필요한 경우 DSM 작업 스케줄러의 사용자 `root`, 매일 02:00으로 다음 명령을 사용할 수 있습니다. 이 방식은 미적용 대안이며 최신 기본 요구인 API 매시간 관리자 백업을 대체하지 않습니다.

```sh
/bin/sh /volume1/docker/ERP/scripts/backup-nas-postgres.sh
```

예약 스크립트는 NAS 안에서 덤프·아카이브 목록·SHA256을 검사합니다. 전체 복원 검증은 하지 않으므로 주기적으로 Windows 명령을 별도로 실행합니다. 실패한 결과는 숨김 `.partial` 디렉터리로 남고 완료 백업을 덮어쓰거나 자동 삭제하지 않습니다. `.backup-lock`이 남으면 실행 중인 작업이 없는지 확인한 후 처리합니다. 보관 수명은 아직 지정하지 않았으며 용량과 별도 장치 사본은 운영자가 관리합니다.

### 한 번만 수행하는 DB 분리

기존 PostgreSQL 이미지 `tempchain-erp-postgres:18.6`, 비밀번호, 볼륨을 재사용합니다. DB 이미지 교체·버전 업그레이드는 이번 분리에 포함하지 않습니다. DB 프로젝트에는 `build`가 없고 `pull_policy: never`로 지정되어 있습니다. 외부 볼륨이 없으면 시작을 거부하며 대체 볼륨을 자동 생성하지 않습니다.

1. 위 전체 복원 검증 백업 성공을 확인합니다. Synology Drive의 파일 동기화가 완료되어 NAS 두 경로에 새 YAML과 스크립트가 있는지 확인합니다.
2. NAS SSH에서 아래 사전 확인을 실행합니다. 볼륨 출력이 `volume erp_postgres-data /var/lib/postgresql`과 다르면 진행하지 않습니다.

```sh
sudo docker inspect --format '{{range .Mounts}}{{if eq .Destination "/var/lib/postgresql"}}{{.Type}} {{.Name}} {{.Destination}}{{end}}{{end}}' erp-postgres
sudo docker volume inspect erp_postgres-data --format '{{.Name}}'
sudo docker image inspect tempchain-erp-postgres:18.6 --format '{{.Id}}'
sudo docker network inspect erp-database >/dev/null 2>&1 || sudo docker network create erp-database
```

3. 최초 전환은 잠깐의 서비스 중단이 필요합니다. 기존 프로젝트의 앱과 DB를 중지하고 **기존 DB 컨테이너만** 제거한 뒤 새 DB 프로젝트를 시작합니다. 아래는 마스터가 NAS에서 실행하며 볼륨 삭제 옵션을 추가하지 않습니다.

```sh
sudo docker compose -p erp -f /volume1/docker/compose.yaml stop web api directory postgres
sudo docker compose -p erp -f /volume1/docker/compose.yaml rm -f postgres
sudo docker compose -p erp-db -f /volume1/docker/erp-db/compose.yaml up -d
sudo docker exec erp-postgres sh -c 'pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
```

마지막 준비 확인이 성공한 뒤 다음 단계로 진행합니다. 기존 DB와 새 DB를 같은 볼륨에 동시에 실행하지 않습니다. 문제가 생기면 앱을 시작하지 말고 DB 로그·볼륨을 확인합니다. 되돌릴 때는 새 DB 프로젝트를 중지하고 그 DB 컨테이너만 제거한 뒤 기존 통합 YAML로 시작하며, 어느 경로에서도 볼륨을 삭제하지 않습니다.

4. Container Manager에서 기존 `erp` 이름과 볼륨을 유지하고 프로젝트 기준 경로를 `/docker`로 맞춘 뒤 YAML을 **`/docker/compose.app.yaml` 내용으로 교체**합니다. `postgres` 서비스가 사라졌는지 확인한 후 빌드·시작합니다. 새 DB 프로젝트는 `/docker/erp-db/compose.yaml`이며 DB 운영과 관리에만 사용합니다. CLI로 앱을 시작할 경우:

```sh
sudo docker compose -p erp -f /volume1/docker/compose.app.yaml up -d --build
```

5. Web Station 기존 포털과 HTTPS `/api/health`, 실제 로그인·기존 업무 데이터, directory 갱신을 확인합니다. 이후 ERP 재빌드는 반드시 `compose.app.yaml`이 등록된 `erp` 프로젝트에서만 수행합니다. 기존 통합 `compose.yaml`은 로컬 검증·전환 이전용이며 분리 후 NAS 프로젝트에 다시 적용하지 않습니다.

### 분리 후 보장 범위

ERP 앱 구성에는 DB 서비스·DB 볼륨이 없고 API만 외부 `erp-database` 네트워크로 DB에 연결합니다. `postgres:5432` 주소와 기존 환경 파일은 유지됩니다. 앱의 빌드·컨테이너 재생성·프로젝트 정리로 DB 컨테이너를 재생성하거나 볼륨을 삭제하지 않습니다. 단, API의 정상 업무 저장과 시작 시 스키마 마이그레이션은 DB에 반영되므로 버전 변경 전 백업은 계속 필요합니다.

근거: [Docker 외부 볼륨](https://docs.docker.com/reference/compose-file/volumes/), [프로젝트 간 네트워크](https://docs.docker.com/compose/how-tos/networking/), [PostgreSQL pg_dump](https://www.postgresql.org/docs/18/app-pgdump.html).

현재 설정: NAS `192.168.0.7`, DSM `https://tempchain.myds.me:3300`, ERP `https://tempchain.myds.me`(443), Container Manager 프로젝트 `erp`, 기존 등록 경로 `/docker/ERP`(이동 후 적용 경로 `/docker`, NAS 프로젝트 재등록은 미실행).

## 준비된 파일

Compose·Dockerfile은 저장소 루트 기준이며, 아래 `apps/`, `deploy/`, `services/` 경로는 `ERP/` 기준입니다.

| 파일 | 용도 |
|---|---|
| [compose.yaml](/home/tempchian-1/tempchain/docker/compose.yaml) | 현재 api/web 앱 전용 구성; 아래 4개 서비스 설명은 과거 이력 |
| [Dockerfile](/home/tempchian-1/tempchain/docker/Dockerfile) | API와 웹 다단계 빌드, 비밀값 제외 |
| `apps/api/.env` | Windows 개발 API, NAS PostgreSQL의 5432 포트 사용 |
| `deploy/nas/api.env` | NAS API, Docker 내부 `postgres:5432` 사용 |
| `deploy/nas/postgres.env` | PostgreSQL 최초 DB·사용자·비밀번호 |
| `services/nas-directory/secrets/directory-key` | 조회 서비스 전용 키, 두 API 환경 파일과 동일 |

위 비밀 파일은 기존 비공개 설정으로 보존합니다. 초기 ERP 관리자 ID는 `admin`이며 초기 비밀번호는 `apps/api/.env`의 `ERP_NODE_ADMIN_PASSWORD`에서 확인합니다. NAS 직원 비밀번호와 별개이며 ERP 초기 관리자 비밀번호·조회 키·DB 비밀번호는 서로 다릅니다. 환경 파일을 캡처하거나 공유하지 마세요.

```env
ERP_NAS_DIRECTORY_SOURCE=bridge
ERP_NAS_DIRECTORY_URL=https://tempchain.myds.me
ERP_NAS_DIRECTORY_CONNECT_ADDRESS=192.168.0.7
ERP_NAS_DIRECTORY_LOGIN_ID=
ERP_NAS_DIRECTORY_PASSWORD=
```

`ERP_DATABASE_URL`도 실제 생성 비밀번호로 채웠습니다. Windows와 NAS API는 동일한 PostgreSQL DB와 `public` 스키마를 사용하므로 개발 화면의 저장도 해당 DB에 반영됩니다. `ERP_NODE_DATABASE`는 제거했으며 현재 데이터는 보존하며 SQLite를 **자동 이관하지 않습니다**. 기존 PostgreSQL 볼륨을 재사용하고 초기화하지 않습니다.

## 1. 동기화 파일과 NAS 실제 경로 확인

File Station의 `/docker` 안에 `compose.yaml`, `compose.app.yaml`, `Dockerfile`, `Dockerfile.directory`, `.dockerignore`, `Dockerfile.directory.dockerignore`가 있고, `/docker/ERP` 안에 `package*.json`, `apps`, `services`, `deploy`가 있는지 확인합니다. 위 비밀 파일과 디렉터리 키도 동기화되어야 합니다. 새 Compose 기준 디렉터리는 `/docker`이며 따로 서비스 설치 폴더나 ZIP을 만들지 않습니다.

File Station → ERP 폴더 속성 → **위치**에서 실제 `/volumeN/...` 경로를 확인합니다. 현재 확인된 경로는 `/volume1/docker/ERP`이며 다른 NAS에 설치할 때 아래 스크립트와 host exporter의 경로를 함께 맞춥니다.

제어판 → 작업 스케줄러 → 생성 → 예약된 작업 → 사용자 정의 스크립트에서 사용자 `root`로 아래를 **한 번 실행**합니다. 설정 파일을 읽는 디렉터리 컨테이너의 UID 1000에 서비스 키 읽기 권한을 부여하는 작업입니다.

```sh
PROJECT=/volume1/docker/ERP
test -f "$PROJECT/../compose.yaml" || exit 1
test -f "$PROJECT/services/nas-directory/secrets/directory-key" || exit 1
mkdir -p "$PROJECT/services/nas-directory/data"
chmod 755 "$PROJECT/services/nas-directory/data"
chown 1000:1000 "$PROJECT/services/nas-directory/secrets" "$PROJECT/services/nas-directory/secrets/directory-key"
chmod 700 "$PROJECT/services/nas-directory/secrets"
chmod 400 "$PROJECT/services/nas-directory/secrets/directory-key"
```

## 2. Container Manager에서 전체 ERP 실행

아래는 분리 전 통합 구성의 설치 절차입니다. 현재 운영 프로젝트를 새로 만들거나 DB를 초기화하지 않으며, DB 분리가 끝난 환경에서는 위 앱 전용 구성을 사용합니다.

1. 프로젝트 → 생성 → 이름 **erp**, 경로 **/docker**.
2. 원본 `docker-compose.yml 업로드`에서 루트 **compose.yaml**을 선택합니다. YAML 안의 경로는 프로젝트 루트 기준입니다.
3. 웹 포털 설정을 체크하고 `web / 8080 / HTTP`를 선택한 뒤 프로젝트 빌드·시작을 진행합니다.
4. `postgres`, `api`, `web`, `directory` 4개 컨테이너를 확인합니다. 최초에는 이미지 다운로드·빌드 시간이 필요합니다.

PostgreSQL은 `postgres:18.6-alpine 기반의 tempchain-erp-postgres:18.6`과 이름 있는 `postgres-data` 볼륨을 사용합니다. PostgreSQL 18의 데이터 볼륨 경로는 `/var/lib/postgresql`이며 원본 소스 폴더와 분리됩니다. `api`는 DB 상태 확인 후 시작하며 빈 DB에 스키마·관리자·세 부서를 초기화합니다. [PostgreSQL 공식 이미지 안내](https://hub.docker.com/_/postgres)

DB 재사용 시 환경변수만 바꾸어 기존 비밀번호를 재설정하지 않습니다. 재빌드할 때 DB 볼륨을 유지하고, 데이터 보존이 필요하면 프로젝트 삭제 화면에서 볼륨 삭제를 선택하지 않습니다. 기존 SQLite를 이 볼륨에 복사하지 않습니다.

## 3. 계정 목록을 매분 갱신

현재 적용 방식은 DSM `ERP directory refresh`, 사용자 `scott0318`, 매일 00:00~23:59, 반복 간격 **1분**입니다. NAS Node.js_v22 패키지와 기존 계정의 `/etc/passwd`·`/etc/group` 읽기 및 data 쓰기 권한을 사용합니다.

```sh
/bin/sh /volume1/docker/ERP/services/nas-directory/refresh-snapshot-host.sh
```

2026-09-15 HTTPS 계정 조회 200과 12:23 예약 실행의 파일 갱신을 확인했습니다. 재설치 시 기존 작업·실제 경로·권한을 먼저 확인하며, 아래 root/Docker 방식은 host 방식 사용이 어려울 때만 선택하는 대안입니다.

대안은 프로젝트 이미지 빌드 후 사용자 `root`, 매일, 반복 간격 **1분**, 하루 전체로 다음 명령을 예약하고 첫 실행을 직접 확인합니다. 두 방식을 중복 등록하지 않습니다.

```sh
/bin/sh /volume1/docker/ERP/services/nas-directory/refresh-snapshot.sh /volume1/docker/ERP
```

두 경로 모두 1단계에서 확인한 위치를 사용합니다. NAS의 `/etc/passwd`·`/etc/group`를 일회성 네트워크 없는 컨테이너가 읽어 이름·UID·그룹·설명만 내보냅니다. 비밀번호 파일이나 Docker 소켓을 조회 서버에 넘기지 않습니다. 목록이 없거나 180초 이상 오래되면 NAS 로그인을 거부합니다.

조회 서비스는 계정 하나 조회만 제공하며 NAS 계정 생성·삭제·비밀번호 변경 기능이 없습니다. 새 NAS 계정을 `erp` 또는 `administrators` 그룹에 넣으면 다음 목록 갱신 후 ERP 첫 로그인에서 자동 등록됩니다. 계정 관리에는 ERP에 등록된 계정이 표시되며 NAS 전체 목록을 미리 일괄 생성하지 않습니다.

## 4. Web Station HTTPS 웹 포털

마스터가 선택한 Web Station 방식으로 설정합니다. 역방향 프록시 규칙을 별도로 만들 필요는 없습니다.

Container Manager 웹 포털 화면에서는 `web / 8080 / HTTP`를 선택합니다. Web Station → 웹 포털에서 생성된 컨테이너 서비스를 선택하고 다음 값으로 설정합니다.

| 항목 | 값 |
|---|---|
| 포털 유형 | 이름 기반 |
| 호스트 이름 | tempchain.myds.me |
| 외부 HTTPS 포트 | 443 |
| 컨테이너 서비스 | web, 내부 연결 HTTP 8080 |

제어판 → 보안 → 인증서에서 해당 포털에 `tempchain.myds.me`의 유효한 인증서를 연결합니다. DSM HTTPS 3300은 유지합니다. 동일 호스트·443에 기존 포털이 있으면 덮어쓰지 말고 충돌 여부부터 확인합니다.

웹·`/api/`·`/v1/identity`가 같은 HTTPS 주소로 연결됩니다. 컨테이너로 전달하는 HTTP와 사용자가 접속하는 외부 HTTPS를 구분합니다. 별도 조회용 3301/18011 포털은 사용하지 않습니다. 실제 Web Station 연결·인증서는 NAS에서 확인해야 합니다.

## 5. Windows 개발 실행과 로그인 확인

PostgreSQL은 Windows 개발 연결을 위해 NAS LAN 주소 **192.168.0.7:5432**에도 바인딩합니다. NAS 방화벽에서 개발 PC만 5432에 접근하도록 허용하고 공유기에 해당 포트를 외부 포워딩하지 않습니다. NAS 컨테이너끼리는 내부 네트워크로 연결합니다.

```powershell
Set-Location D:\SynologyDrive\docker\ERP
conda run -n scott --no-capture-output npm run dev
```

개발 서버는 마스터가 실행합니다. 기존 6174 덮어쓰기는 제거했으며 Vue 기본 5174, API 기본 8010을 사용합니다. Windows 포트 예약 진단과 미적용 복구 스크립트는 [개발 안내](NODE_REBUILD.md#명령과-개발-포트)를 참고합니다. 이미 실행 중이면 마스터 터미널에서 Ctrl+C 후 재실행해야 환경 변경이 반영됩니다. NAS PostgreSQL이 아직 실행되지 않았으면 API 시작도 완료되지 않습니다.

1. NAS ERP 주소에서 초기 로컬 `admin` 로그인 확인.
2. `erp` 직원의 NAS 아이디·비밀번호로 로그인하고 NAS 설명→이름, 단일 일치 활성 그룹→부서(ERP 수동 지정 우선), 관리자 직급·사번 보존 확인.
3. NAS `administrators` 구성원의 관리자 메뉴 접근 및 그룹 없는 계정 거부 확인.
4. 직원이 내 정보에서 본인 현재·새 비밀번호를 입력해 변경하고 새 비밀번호로 DSM·ERP 로그인 확인.

`erp-account` 같은 공유 DSM 조회 계정은 이 구성에서 사용하지 않습니다. **직원 자신의 DSM 인증 권한은 필요합니다**. 직원의 DSM 접근까지 거부하는 구성은 현재 직접 인증 API 방식에서 지원하지 않으며 조회 서비스가 이를 우회하지 않습니다. 비밀번호 변경은 직원 본인 DSM 세션으로 요청하고 NAS 비밀번호는 ERP DB에 저장하지 않습니다.

실제 DSM 설명이 ERP 이름과 일치하는지, 실제 로그인·비밀번호 변경이 가능한지는 최신 앱 배포 후 확인해야 합니다. host exporter 이메일 수집은 미완료이며 빈 조회 결과는 기존 ERP 이메일을 보존합니다. NAS 그룹 변경이 이미 발급된 ERP 세션에 즉시 통보되지는 않으며 기본 고정 만료는 60분입니다.

## 점검과 유지

로컬 API·조회 서비스·개발 감시 및 Docker 격리 실행의 날짜별 결과는 검증 기록에서 관리합니다. 최종 결과와 NAS 실환경에서 남은 확인 항목은 [검증 기록](VALIDATION.md)을 참고합니다.

`conda run -n scott npm run nas:prepare`는 기존 키·DB 비밀번호를 재생성하지 않으며 서로 다른 기존 DB URL은 덮어쓰지 않습니다. DB 접속 설정을 수동 변경할 경우 Windows `.env`, NAS `api.env`, 실제 PostgreSQL 자격 증명을 함께 맞춰야 합니다. 첫 관리자 설정은 새 빈 DB 초기화에만 사용됩니다.

개발 테스트 `conda run -n scott npm test`는 운영 DB를 읽지 않고 임시 PostgreSQL을 시작하여 무작위 스키마를 검사한 뒤 정리합니다. 지정 테스트 DB를 쓰려면 `ERP_TEST_DATABASE_URL`을 별도로 사용하며 해당 실행이 만든 테스트 스키마만 정리합니다. 트랜잭션은 동일 PostgreSQL 연결을 사용하고 ERP 스키마별 advisory lock으로 변경 작업을 직렬화합니다. [node-postgres 트랜잭션 문서](https://node-postgres.com/features/transactions)

## NAS CPU CFS 오류로 생성이 중단된 경우

`Successfully built` 뒤 `NanoCPUs can not be set ... kernel does not support CPU CFS`가 나오면 이미지 빌드가 아닌 컨테이너 CPU 제한 적용 실패입니다. 수정된 compose.yaml은 `cpus`·`cpu_quota`·`cpu_period`를 지정하지 않습니다.

Container Manager → 프로젝트 → erp의 YAML 편집 화면에 수정된 루트 compose.yaml을 반영하고 재빌드/재생성합니다. 업로드 당시 저장된 프로젝트 YAML이 자동으로 바뀌지 않을 수 있으므로 `cpus: 0.5`가 남아 있지 않은지 확인합니다. 기존 이미지 캐시를 사용해도 되며 CPU 설정은 컨테이너 재생성 때 적용됩니다. `erp_postgres-data` 볼륨과 환경 파일은 삭제하지 않습니다.

## 현재 운영 점검: 2026-09-15

마지막 기록에서 통합 프로젝트 컨테이너 실행, Web Station 연결 복구, host exporter 계정 조회 200과 매분 예약 갱신을 확인했습니다. 컨테이너 이름은 erp-postgres, erp-api, erp-web, erp-directory이며 현재 개별 health·최신 앱 적용·실제 직원 인증은 별도 확인이 필요합니다. 아래는 장애가 다시 발생했을 때의 절차이고 과거 관찰은 [검증 기록](VALIDATION.md)에 보존합니다.

### directory 경고 확인 — 읽기 전용

아래는 마스터가 NAS SSH에서 실행하는 Linux 명령입니다. 전체 docker inspect나 환경 파일·목록 원문을 출력하지 않습니다.

```sh
sudo docker inspect --format '{{.State.Status}} health={{.State.Health.Status}} restarts={{.RestartCount}} oom={{.State.OOMKilled}}' erp-directory
sudo docker logs --tail 30 erp-directory
sudo docker exec erp-directory node -e 'fetch("http://127.0.0.1:8011/health").then(async r=>console.log(r.status,await r.text()))'
sudo docker exec erp-directory node -e 'const fs=require("node:fs");try{const p="/snapshot/identity.json";const s=fs.statSync(p);console.log({bytes:s.size,uid:s.uid,gid:s.gid,mode:(s.mode&511).toString(8),modified:s.mtime.toISOString()});fs.accessSync(p,fs.constants.R_OK);if(s.size<=2097152){const v=JSON.parse(fs.readFileSync(p,"utf8"));console.log({generatedAt:Number.isSafeInteger(v.generatedAt)?v.generatedAt:null,ageSeconds:Number.isSafeInteger(v.generatedAt)?Math.floor((Date.now()-v.generatedAt)/1000):null});}}catch(e){console.log({error:["ENOENT","EACCES","EPERM"].includes(e.code)?e.code:e instanceof SyntaxError?"invalid_json":"check_failed"});process.exitCode=1}'
```

새 로컬 진단 코드가 포함된 이미지를 마스터가 빌드·적용하면 health 로그는 최초 점검과 원인/상태 변경 때만 남습니다. 기존 NAS 이미지에서는 이 로그가 없을 수 있습니다. `/health` 응답은 계속 200 `{ready:true}` 또는 503 `{ready:false}`이며 원인은 외부 응답에 포함하지 않습니다.

| 로그 코드 | 점검/조치 |
|---|---|
| missing | identity.json 미생성 또는 마운트 경로 오류; 최초 exporter 실행 결과 확인 |
| permission | UID 1000의 디렉터리 접근·파일 읽기 권한과 NAS ACL 확인; 전체 폴더 777 금지 |
| stale | generatedAt 기준 180초 초과; 매분 갱신 작업과 최근 실패 결과 확인 |
| invalid_json / invalid_schema | 파일 손상·형식·미래 시각·중복 계정 등 확인; 직접 원문 편집 대신 exporter로 재생성 |
| too_large | 2 MiB 초과; 입력/출력 크기 원인을 점검하고 제한은 유지 |
| unexpected_error | 마운트·파일시스템 등 추가 점검; 원문/키를 로그에 추가하지 않음 |
| ready | 목록 검증 통과; 이후 지속 갱신 여부 확인 |

### 마스터 적용 순서

1. 현재 등록된 `ERP directory refresh`의 최근 실행 결과와 위 명령의 NAS 파일 상태를 확인합니다.
2. 실제 적용된 서버/exporter 코드와 소스 동기화 상태를 구분합니다. 이미지 변경이 필요한 경우에만 올바른 통합/앱 전용 Compose로 반영하고 DB 볼륨·환경 파일·키를 유지합니다.
3. 현재 host 방식이면 3절의 `refresh-snapshot-host.sh`를 기존 예약 사용자로 실행합니다. 성공 메시지가 없으면 아래 exporter 원인을 먼저 해결합니다.
4. 동일 host 명령의 하루 전체 1분 예약을 확인합니다. root/container 대안을 선택할 때는 기존 ERP host 예약과 중복 실행하지 않으며 다른 공유 폴더 스냅샷 작업은 수정하지 않습니다.
5. 생성 시각이 계속 전진하고 180초 이상 관찰하는 동안 health 200과 컨테이너 정상이 유지되는지 확인합니다. 재시작만으로 해결됐다고 판단하지 않습니다.

Exporter는 read-passwd / read-group / validate-source / write-snapshot / publish-snapshot 단계와 허용된 원인만 기록합니다. ENOENT는 입력·출력 경로, EACCES/EPERM/EROFS는 해당 단계의 권한·읽기 전용 마운트, ENOSPC/EDQUOT는 저장 공간·할당량을 확인합니다. Required NAS groups missing은 erp 및 administrators 그룹 존재 여부, 형식 오류는 입력 소스를 점검합니다. PIDs 제한 미지원 경고만으로 실패 원인을 단정하지 않습니다.

### Web Station 404는 별도로 복구

이전에는 서비스 등록 누락과 기존 포털의 오래된 프로젝트 참조로 404가 발생했으며, 마스터의 서비스 동기화·포털 재연결 후 HTTPS API 정상 응답을 확인했습니다. 재빌드 후 다시 404가 발생하면 서비스 등록과 기존 포털 연결 대상을 확인합니다. 임의로 중복 포털·역방향 프록시를 추가하지 않습니다. NAS 내부 127.0.0.1:8080 바인딩은 PC에서 NAS:8080으로 접속되지 않는 것이 정상일 수 있습니다.

후속 SSH 키 접속에서 이전 목록 부재·DSM 그룹 주석 처리 실패를 확인했고 이후 최신 host exporter와 매분 예약으로 조회를 복구했습니다. 최신 증거는 [검증 기록](VALIDATION.md)을 따릅니다.

### Invalid group source가 발생한 경우

2026-09-15 확인된 원인은 DSM /etc/group 첫 줄의 주석을 이전 exporter가 데이터로 해석한 것입니다. 최신 소스는 전체 줄 주석·빈 줄을 처리하며 나머지 레코드 검증은 유지합니다. 현재 host 방식은 소스 동기화와 host 명령을 확인합니다. 아래는 분리 전 통합 프로젝트에서 container exporter 대안을 사용할 때의 명령입니다(분리 후에는 compose.app.yaml 사용).

```sh
sudo docker compose -f /volume1/docker/compose.yaml build directory
sudo /bin/sh /volume1/docker/ERP/services/nas-directory/refresh-snapshot.sh /volume1/docker/ERP
```

첫 명령 성공 후 두 번째 명령을 실행합니다. 성공 메시지 NAS directory snapshot refreshed.와 선택한 한 가지 방식의 매분 예약을 확인합니다. 기존 directory 서버는 새 목록을 매 요청 읽으므로 목록 복구를 위해 전체 ERP를 재시작할 필요는 없습니다.
