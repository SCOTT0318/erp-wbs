# TempChain ERP 문서 인덱스

정리 기준일: **2026-09-21**

모든 Markdown 문서는 `/home/tempchian-1/바탕화면/erp-wbs/docs/` 폴더에서 관리합니다. [WBS·문서 현황판](../index.html)은 진행률 3%와 전체 문서 목록을 제공하며, 문서를 선택하면 같은 화면에서 내용을 열람할 수 있습니다.

## 우선 확인

| 문서 | 상태 | 내용 |
| --- | --- | --- |
| [AI 인수인계](AI_HANDOFF.md) | 최신 | 현재 구성·구현·보존 원칙과 다음 작업 |
| [ERP 전체 WBS](WBS.md) | 최신 | 완료 기반 3%와 향후 작업 97% |
| [독립 운영 DB](STANDALONE_DATABASE.md) | 최신 | `tempchain-erp-database`와 api/web 앱 연결 |
| [개발·재빌드 안내](NODE_REBUILD.md) | 최신 | Windows·Miniconda 명령, 환경 변수와 검증 |
| [검증 기록](VALIDATION.md) | 누적 이력 | 날짜별 빌드·테스트·운영 관찰과 한계 |
| [공통 작업 규칙](/home/tempchian-1/tempchain/docker/AGENTS.md) | 최신 | 코드·데이터·자격 증명 보존 원칙 |

## 기획과 업무

| 문서 | 내용 |
| --- | --- |
| [WBS 관리 안내](WBS_METHOD.md) | 3% 기준선, 가중치와 갱신 규칙 |
| [생산 업무 계약](PRODUCTION.md) | 자재·재고·컨테이너·생산지시와 API 규칙 |
| [업무공간·검색·달력](WORKSPACE_SEARCH_CALENDAR.md) | 통합 검색, 월간 납기와 공휴일 |
| [2026-09-17 인수인계](handoff/2026-09-17.md) | 해당 일자의 구현·검증 상세 이력 |

## 개발과 서비스

| 문서 | 내용 |
| --- | --- |
| [ERP 개요](ERP_README.md) | 기능, 기술 구성과 실행 개요 |
| [환경 파일 배치](ENV_UPLOAD_GUIDE.md) | 비공개 환경 파일 원본·업로드 위치 |
| [업데이트 안내 페이지](UPDATE_PAGE.md) | 독립 점검 안내 서비스 사용법 |
| [공용 오류 페이지](ERROR_PAGES.md) | Web Station 오류 화면 구성·재생성 |
| [UI 자산](UI_ASSETS_README.md) | 회사 로고·아이콘과 라이선스 |

## NAS와 데이터 운영

| 문서 | 상태 | 내용 |
| --- | --- | --- |
| [NAS 인증](NAS_AUTH.md) | 최신 | DSM 직접 인증과 계정 동기화 |
| [DSM 웹 로그인 매뉴얼](SYNOLOGY_DSM_WEB_LOGIN_MANUAL.md) | 설계 원문 | DSM API, 조회 계정과 사용자·그룹 계약 |
| [NAS 설치·장애 대응](NAS_POSTGRES_SETUP.md) | 최신+이력 | 현재 절차와 날짜별 과거 전환 기록 |
| [DB·백업](DATABASE_README.md) | 최신 | 데이터, 백업과 서명 키 보존 원칙 |
| [Directory bridge](NAS_DIRECTORY_README.md) | 비활성 이력 | 현재 운영에서 사용하지 않는 이전 조회 서비스 |
| [NAS 재생성 점검](NAS_RECREATE_CHECK.md) | 과거 자료 | 2026-09-15 당시 구성 점검 기록 |

## 현재 기준

- 애플리케이션은 Vue 3·Fastify·TypeScript·PostgreSQL이며 코드 스키마는 v9입니다.
- 운영 앱 Compose는 api/web만 배포하고 독립 PostgreSQL 컨테이너에 연결합니다.
- 운영 인증은 DSM 직접 조회 방식입니다. 이전 directory bridge와 스냅샷은 비활성 이력으로 보존합니다.
- 금융·회계는 구축 범위에서 제외합니다. 향후 기능은 미리 확정하지 않고 생산부 → 사업부 → 기술개발부 순서로 회의·요구사항 정리·프로세스 설계·구현·부서 확인을 진행합니다.
- 과거 문서의 테스트·배포 성공 기록은 해당 날짜의 증거이며 현재 환경의 새 검증으로 해석하지 않습니다.

[저장소 루트](/home/tempchian-1/tempchain/docker/README.md)
