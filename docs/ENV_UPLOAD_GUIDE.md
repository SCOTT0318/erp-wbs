# 수동 환경파일 업로드 안내

현재 NAS 배포에 필요한 파일은 아래 두 개입니다. 파일 내용은 이 문서나 현황판에 포함하지 않습니다.

| 원본 | NAS 대상 | 목적 |
|---|---|---|
| erp/deploy/nas/api.env | /volume1/docker/erp/deploy/nas/api.env | 운영 ERP API |
| erp-updatepage/.env | /volume1/docker/erp-updatepage/.env | 업데이트 안내 설정 인증 |

숨김 파일은 전송에서 누락될 수 있습니다. 보이는 파일명으로 업로드한 경우 대상에서 정확한 이름으로 바꾸세요. 원래 파일이 있으면 보관 후 교체하고 Compose 컨테이너를 재생성해야 환경변수가 반영됩니다.

## 업로드하지 않을 파일
- erp/apps/api/.env: 로컬 테스트 DB용. 운영 서버에 적용하지 않습니다.
- erp/deploy/nas/postgres.env: 과거 DB 환경 보존용. 현재 수동 생성 운영 DB에 적용하지 않습니다.
- 백업 서명 키와 bridge 키·스냅샷: 이번 환경파일 묶음 범위가 아닙니다.

## 사본 생성 안 함
사용자 선택에 따라 환경파일을 docs에 복사하지 않았습니다. 위 원본 두 개를 직접 선택하여 업로드하세요. 원본·자격증명은 Git과 공개 HTML에 포함하지 않습니다.
