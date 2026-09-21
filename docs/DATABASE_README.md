# ERP DB 및 백업

이 문서의 상대 경로는 저장소 루트 `erp-db/` 기준입니다. 이 디렉터리에서는 보존용 `compose.yaml`만 Git으로 추적하고 데이터·덤프·관리 백업·`.signing-key`는 루트 `.gitignore`로 제외합니다.

## 현재 데이터 위치

| 구분 | 위치와 용도 |
| --- | --- |
| NAS 운영 DB | Container Manager에서 직접 생성한 `tempchain-erp-database`; `/docker/erp-db/data` → `/var/lib/postgresql` |
| NAS DB 접속 | 앱 내부 `tempchain-erp-database:5432/tempchain_erp`, 외부 NAS 포트 5433; `erp-database` 네트워크 |
| 로컬 개발 DB | 별도 Docker Desktop `tempchain-erp-test`, `127.0.0.1:5433/tempchain_erp_test`, 전용 볼륨 `tempchain-erp-test-data` |
| `managed/` | 관리자 페이지의 전체 DB 백업·서명 업로드·복원과 시간별 자동 백업 저장소 |
| 기존 `erp-*` 폴더 | 이전 덤프와 복원 검증 원본; 새 데이터와 구분하여 보존 |
| `compose.yaml` | 과거 `erp-postgres`/`erp_postgres-data` 외부 볼륨 구성 보존용; 현재 새 운영 DB에는 실행하지 않음 |

현재 운영 기준은 [독립 DB 안내](STANDALONE_DATABASE.md)입니다. 루트의 두 Compose는 앱 전용이고 DB 서비스/데이터 볼륨을 소유하지 않습니다. 과거 Docker 볼륨과 기존 백업을 임의로 삭제·이동하거나 같은 데이터 경로에 두 PostgreSQL 컨테이너를 실행하지 않습니다.

## 백업 계약과 남은 확인

- NAS 앱은 `/docker/erp-db/managed`를 `/backups`로 연결하며 API UID 1000이 필요한 읽기/쓰기 권한을 가져야 합니다. `managed/.signing-key`를 포함한 폴더 전체를 보관하고 키를 재생성하지 않습니다.
- 2026-09-15 15:16 KST 점검은 기존 서명 키 UID 1031/mode 600과 API UID 1000의 불일치를 확인했습니다. 이후 권한 해결과 실제 시간별 자동 백업 실행은 확인되지 않았습니다.
- 백업은 설정된 DB 전체 `pg_dump`이며 다른 DB·클러스터 역할·NAS 파일은 포함하지 않습니다. 관리자 UI 복원은 현재 v7 호환 스키마/테이블과 서명을 검사합니다.
- 이전 백업은 별도 마이그레이션용으로 원본을 유지합니다. unsigned SQL 업로드는 실행하지 않으며 실제 운영 DB 복원은 수행하지 않았습니다.
- 로컬 테스트 DB에서는 백업 경로/자동 백업을 기본 비활성화하며 필요 시 별도의 쓰기 가능한 경로·키·PostgreSQL 클라이언트를 설정합니다. NAS 설정과 로컬 `.env`를 자동 일치시키지 않습니다.
- 기존 `nas:backup`과 `scripts/backup-nas-postgres.sh`는 이전 DB 주소/컨테이너에 의존합니다. 보존용 도구로 유지하며 현재 독립 운영 DB 대상으로 검증하기 전에는 실행하지 않습니다.

백업에는 실제 업무 데이터가 포함되므로 이 디렉터리를 웹 공개 경로에 연결하지 않습니다. 자세한 과거 검증은 [검증 기록](VALIDATION.md), 현재 작업 제약은 [인수인계](AI_HANDOFF.md)를 참고합니다.
