# NAS 읽기 전용 계정 조회

> 현재 운영 인증은 DSM 직접 조회 방식이며 이 문서는 비활성 directory bridge의 보존 이력입니다. 루트 [compose.yaml](/home/tempchian-1/tempchain/docker/compose.yaml)과 [compose.app.yaml](/home/tempchian-1/tempchain/docker/compose.app.yaml)은 api/web만 배포하고 directory 서비스를 실행하지 않습니다.

과거 설치·권한·매분 작업·HTTPS 설정 기록은 [전체 NAS 안내](NAS_POSTGRES_SETUP.md)와 함께 당시 이력으로만 참고합니다.

- snapshot.mjs: 비밀번호를 제외한 이름·UID·그룹·설명 내보내기와 만료/중복/형식 검사.
- export.mjs: 일회성 컨테이너 또는 `--nas-host` 모드에서 원자적으로 JSON 저장.
- refresh-snapshot-host.sh: 현재 DSM 예약 방식; 기존 `scott0318` 사용자와 NAS Node.js_v22로 실행하며 root/Docker 권한 불필요.
- refresh-snapshot.sh: 대체 방식의 네트워크 없는 내보내기 컨테이너 실행; NAS 실제 ERP 경로를 인자로 받음.
- server.mjs: 키로 보호한 POST /v1/identity 단일 조회와 POST /v1/directory 허용 그룹 목록 조회, GET /health 상태 확인.
- profile.mjs: 호스트의 synouser 읽기 결과에서 계정명·UID를 검증하고 이메일만 선택 수집.
- test.mjs: 권한·키·호스트·만료·비밀값 제거 회귀 검사.

서버는 내부 8011만 사용하며 ERP 웹의 HTTPS /v1/identity와 /v1/directory로 연결됩니다. 키는 secrets/directory-key, 목록은 data/identity.json에 있고 이미지에는 포함하지 않습니다. 계정 생성/삭제/비밀번호 API와 Docker 소켓/호스트 root/shadow 마운트가 없습니다.

목록은 매분 갱신하며 180초를 넘으면 조회를 거부합니다. host/container 갱신 작업을 중복 등록하지 않습니다. 설명은 ERP 이름으로 사용하고 host 모드는 이메일을 선택 수집합니다. CLI 읽기 권한은 실제 NAS에서 확인해야 하며 실패하면 비밀값 없는 경고와 빈 이메일을 내보냅니다(ERP 기존 이메일은 유지). 본인 비밀번호 변경과 최초·만료 변경은 API가 DSM에 처리하며 [NAS_AUTH.md](NAS_AUTH.md)를 참고합니다.

상태 점검은 최초 결과와 상태/원인 변경 시에만 안전한 진단 코드를 기록합니다. HTTP 응답과 180초 만료 정책은 유지하며, 코드별 조치와 NAS 적용 순서는 [NAS 진단 안내](NAS_POSTGRES_SETUP.md)를 참고합니다.
