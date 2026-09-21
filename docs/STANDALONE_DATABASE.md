# 직접 생성한 운영 DB와 ERP 앱

> 2026-09-16 폴더 이동: 아래 `/docker`는 새 배치 기준이며 NAS 실환경 적용은 미확인입니다. 기존 컨테이너에 기록된 `/docker/erp-db/data` 마운트는 소스 폴더를 옮겨도 자동 변경되지 않으므로 실제 데이터와 마운트의 일치를 먼저 확인합니다.

## 현재 구성

NAS 외부 접속 포트는 **5433**, 같은 네트워크의 앱 접속은 **tempchain-erp-database:5432**입니다. 운영 계정/DB 이름은 `tempchain_erp`이고 비공개 NAS API 환경 파일에 반영했습니다. 로컬 개발의 `127.0.0.1:5433/tempchain_erp_test`는 별도 DB입니다.

- 운영 DB는 Container Manager에서 공식 PostgreSQL 이미지로 직접 생성한 `tempchain-erp-database`입니다. 프로젝트에서 DB를 생성하지 않습니다.
- 데이터: NAS `/docker/erp-db/data` → 컨테이너 `/var/lib/postgresql`, 읽기/쓰기. 기존 백업·과거 볼륨은 별도로 보존합니다.
- DB와 앱 API가 공유하는 외부 네트워크는 `erp-database`입니다.
- `compose.yaml`과 `compose.app.yaml`은 동일한 앱 전용 구성입니다. 프로젝트 이름은 현재 DSM 등록 이름인 `tempchain-erp`이며 `api`, `web`, `directory`만 포함합니다.
- 앱 Compose에는 PostgreSQL 서비스, 호스트 5432 게시, PostgreSQL 데이터 볼륨, DB 서비스에 대한 depends_on이 없습니다. API는 외부 DB 연결이 가능해진 뒤 정상 기동합니다.
- `erp-db/compose.yaml`은 과거 외부 볼륨 방식의 보존 자료이며 현재 새 운영 DB 실행에 사용하지 않습니다. 테스트 DB는 다른 컴퓨터에서 운영합니다.

## 적용

1. NAS `/docker/compose.yaml`이 동기화됐는지 확인하고 Container Manager의 기존 `tempchain-erp` 프로젝트 편집 화면에도 앱 전용 내용이 반영됐는지 확인합니다.
2. 기존 프로젝트가 만든 DB 컨테이너가 실제 남아 있다면 소속·마운트를 확인한 뒤 그 컨테이너를 중지합니다. Compose에서 서비스를 지워도 기존 컨테이너가 자동 제거되거나 포트가 즉시 해제되지는 않습니다. DB 볼륨이나 폴더는 삭제하지 않습니다.
3. 직접 생성한 DB를 시작합니다. 호스트 5432가 계속 충돌하면 실제 점유 프로세스 확인이 필요하며, Compose 수정만으로 충돌 해소를 단정하지 않습니다.
4. 비공개 `erp/deploy/nas/api.env`의 `ERP_DATABASE_URL`을 새 DB와 맞춥니다: `postgresql://tempchain_erp:<URL 인코딩한 실제 비밀번호>@tempchain-erp-database:5432/tempchain_erp`. 비밀번호는 문서나 Git에 기록하지 않습니다. 기존 `postgres` 호스트명·이전 계정은 새 컨테이너와 자동으로 일치하지 않습니다.
5. 새 빈 DB의 첫 API 시작에는 유효한 `ERP_NODE_ADMIN_PASSWORD`가 필요합니다. API가 ERP 스키마와 초기 관리자 계정을 생성합니다. 기존 데이터 복원은 수행하지 않습니다.
6. 앱 프로젝트를 갱신한 뒤 API health와 로그인을 확인합니다. 이번 Compose 수정에서 실제 NAS 재배포·계정 설정·DB 초기화는 수행하지 않았습니다.

로컬 개발 설정은 운영 DB로 자동 전환하지 않습니다. 다른 컴퓨터의 테스트 DB 주소가 정해지면 별도로 설정합니다.
