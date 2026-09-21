# NAS 프로젝트 재생성 사전 점검 — 2026-09-15 15:16 KST

> 이 문서는 해당 시점의 점검 기록입니다. 이후 운영 DB는 수동 생성한 `tempchain-erp-database`, 앱은 `tempchain-erp`로 변경되었으므로 아래 과거 구성 선택·컨테이너 명령 대신 [현재 독립 DB 안내](STANDALONE_DATABASE.md)를 따릅니다. 백업 키 권한의 해결 여부는 별도 확인이 필요합니다.

## 판정

파일 배치·설정·현재 API/DB 연결은 정상입니다. **백업 서명 키 접근 권한과 관리자 전용 Docker 점검을 완료한 뒤 재생성하세요.** 프로젝트/컨테이너 삭제, DB 복원, 배포 및 권한 변경은 이번 점검에서 실행하지 않았습니다.

## 확인 결과

| 항목 | 결과 |
|---|---|
| NAS 루트 | `/volume1/docker` (Container Manager 경로 `/docker`) |
| 앱 소스·비공개 설정 | `/volume1/docker/ERP` 유지 |
| Compose | 통합·앱 전용·독립 DB 구성 모두 NAS `config --quiet` 통과 |
| 동기화 | Dockerfile 2개, 전용 ignore 2개, Compose 2개, 주요 API/디렉터리 소스, 환경 파일 및 키 일치 |
| 빌드 제외 보완 | NAS에 숨김 `.dockerignore`가 없어 루트 `Dockerfile.dockerignore` 추가, NAS 동기화 일치 확인 |
| API | HTTPS `/api/health` HTTP 200 |
| NAS 계정 조회 | HTTPS 인증된 조회 HTTP 200, 현재 계정 자격 확인, 스냅샷 갱신 확인 |
| PostgreSQL | READ ONLY 트랜잭션 확인: 스키마 v7, 계정 3개, 부서 3개, 삭제되지 않은 거래처 0개 |
| 백업 | managed 안 백업 디렉터리·manifest 각 2개, 별도 덤프 폴더 3개 보존; 이번 점검에서 복원 검증은 미실행 |
| 저장 공간 | volume1 약 3.5 TB 중 22 GB 사용(1%) |
| 서명 키 권한 | `managed/.signing-key`: 소유 UID 1031, mode 600; 새 API는 UID 1000이므로 POSIX 권한상 읽기 불가 |
| Docker 실행 상태 | SSH 사용자 Docker 소켓 접근 불가, `sudo -n`은 비밀번호 필요: 컨테이너·볼륨·이미지·DB 분리 여부 미확인 |

## 재생성 구성 선택

- DB가 기존 통합 `erp` 프로젝트 소속이면 **`/docker/compose.yaml`**, 프로젝트 이름 **`erp`**, 프로젝트 경로 **`/docker`**를 사용합니다. 기존 `erp_postgres-data` 외부 볼륨을 보존합니다.
- DB가 이미 독립 `erp-db` 프로젝트로 옮겨졌고 `erp-database` 외부 네트워크가 확인된 경우에만 앱은 **`/docker/compose.app.yaml`**을 사용합니다. 독립 DB 설정은 `/docker/erp-db/compose.yaml`입니다.
- DB 분리 여부 확인 전 앱 전용 구성으로 변경하거나 두 PostgreSQL을 함께 실행하지 않습니다. 기존 컨테이너가 남아 있으면 동일한 `erp-*` 이름으로 새 컨테이너 생성이 충돌합니다.
- 기존 NAS 프로젝트가 `/docker/ERP` 경로로 등록돼 있다면 재생성할 때 `/docker`로 변경해야 상대 경로가 맞습니다. Web Station 기존 포털의 web/8080 연결과 매분 host exporter 작업 경로는 유지합니다.

## NAS 관리자 터미널에서 남은 읽기 전용 점검

```sh
sudo /usr/local/bin/docker ps -a --format '{{.Names}}: {{.Status}}'
sudo /usr/local/bin/docker inspect erp-postgres --format '{{index .Config.Labels "com.docker.compose.project"}} {{range .Mounts}}{{.Type}} {{.Name}} {{.Destination}}; {{end}}'
sudo /usr/local/bin/docker volume inspect erp_postgres-data --format '{{.Name}}'
sudo /usr/local/bin/docker image inspect tempchain-erp-postgres:18.6 --format '{{.Id}}'
sudo /usr/local/bin/docker network inspect erp-database --format '{{.Name}}'
```

마지막 네트워크가 없으면 DB 분리는 아직 준비되지 않은 상태입니다. 볼륨은 `erp_postgres-data`, 마운트 목적지는 `/var/lib/postgresql`인지 확인합니다. 위 명령은 삭제·생성·시작을 하지 않습니다.

## 재생성 전에 보완할 사항

1. 기존 `managed` 폴더와 `.signing-key`를 보존하면서 새 API UID 1000이 백업 폴더와 기존 백업에 읽기/쓰기하고 서명 키를 읽을 수 있도록 NAS 관리자가 소유권/권한을 맞춥니다. 키를 삭제하거나 새로 생성하지 않습니다. 현재 디렉터리 키·스냅샷 경로의 mode 777도 확인됐으므로 exporter와 API의 필요한 접근만 남기는 별도 권한 정리가 필요합니다.
2. 현재 DB v7 기준의 최신 전체 백업을 확보합니다. 기존 백업이 있다는 사실만으로 현재 데이터의 복원 가능성을 보장하지 않으며, v6 이하 백업은 UI 직접 복원 대상이 아닙니다.
3. 빌드에는 `Dockerfile.dockerignore`와 `Dockerfile.directory.dockerignore`를 반드시 함께 둡니다. 전자는 루트 `.dockerignore`와 같은 제한 목록이며 NAS 숨김 파일 동기화 누락을 보완합니다.
4. 생성 후 컨테이너 health, HTTPS API, 실제 NAS 로그인, 본인 부서 저장/재로그인, 백업 생성과 목록, 180초 이상 디렉터리 갱신을 확인합니다.

상세 절차: [NAS 설치 안내](NAS_POSTGRES_SETUP.md). 로컬 읽기 전용 점검: `ERP/`에서 `conda run -n scott node scripts/audit-nas.mjs`.
