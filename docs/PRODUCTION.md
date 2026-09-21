# 생산부 업무와 API

## 권한과 기본값

관리자와 활성 생산부 구성원은 조회/변경, 활성 사업부·기술개발부는 조회만 가능합니다. 부서 미지정·다른 부서는 기본 거부합니다. 사용자 응답 production_permissions의 read/write를 화면과 API가 공유합니다. 관리자용 계정·부서 권한은 그대로입니다.

부서는 변경 불가 system_key(business/engineering/production)로 식별합니다. v1→v2는 같은 이름의 부서를 재사용하며 다른 부서가 기본 코드를 사용하면 충돌로 전체 롤백합니다. 기존 부서·사용자 ID를 보존합니다.

생산부 단일 재고 기준으로 보관위치·거래처·담당자를 직접 입력합니다. 자재는 소수 3자리(정수×1000 저장), 소형·생산은 정수이며 단건 수량/현재고 최대는 999,999,999 단위입니다. 자재 수불이 있으면 단위 변경을 거부합니다.

## 자재·소형 수불

- 품목: 코드·명칭·규격·단위·보관위치·비고·활성. 코드 중복은 대소문자 구분 없이 거부.
- opening 초기재고: 이력이 없는 품목에 한 번만 허용. 0이면 등록 불필요.
- in 입고, 자재 issue 사용출고, 소형 sale 판매출고: 양수 입력. 판매출고에는 거래처 필수.
- adjust 조정: 실사 증감량을 부호와 함께 입력, 사유 필수. 출고는 서버가 음수로 기록.
- 현재고와 처리 후 재고는 거래 확정 순서로 계산. 업무일은 검색·기록용이며 과거 날짜 입력으로 과거 잔량을 재계산하지 않음.
- 확정 수불은 삭제/덮어쓰기 대신 reversal 역거래로 정정. 음수재고·중복취소·취소의 재취소 거부. 취소일은 원거래일 이후.
- 소형에는 반납·회수 없음. 판매 입력 오류의 취소는 반품 업무와 별개.

## 컨테이너

- 모델 등록 후 고유 제품번호별 최초 입고. 가용 상태와 최초 입고 이력을 함께 생성.
- 출고: 고객·출고일·제품번호 1~100개, 선택 회수예정일·비고. 중복 번호·비가용 개체·비활성 모델 거부.
- 출고 상세에서 이번 회수 번호만 선택해 부분회수·미회수 추적. 다른 출고 제품·중복회수 거부.
- available 가용 → out 출고중 → inspection 점검대기 → available 또는 repair 수리중 → available.
- inspect_ok 점검 정상, inspect_repair 수리 필요, repair_done 수리 완료, send_repair 가용 제품의 수리 전환. 처리일·사유 필수.
- 개체 상태 처리일은 마지막 이력보다 과거일 수 없음. 회수예정일은 출고일 이후.
- 전체 출고 취소는 모든 개체의 마지막 이력이 해당 출고일 때만 허용. 회수/점검 후에는 단순 출고 취소 불가.
- 회수·점검/수리는 개체의 마지막 원이력만 취소 가능. 최초 입고·취소 이력은 취소 불가. 취소 기록 후에는 그보다 이전의 이력을 연쇄 취소하지 않음.

## 생산지시·실적

- 제품(소형/컨테이너)·계획수량·납기·담당자·비고 지정. 생성 후 제품은 고정; 잘못 선택하면 지시 취소 후 다시 등록.
- 대기 → 진행/취소, 진행 → 완료/취소, 완료/취소 → 진행 재개. 상태 변경 사유를 감사 기록으로 저장.
- 진행 중만 양품·불량 실적 등록/취소 가능. 둘 다 0은 거부. 누적 수량은 취소 실적을 반영.
- 계획 초과 생산도 기록 가능. 완료는 수동이며 과소/초과를 자동 보정하지 않음.
- 완료/취소 지시는 메타데이터·실적 잠금; 재개 후 정정.
- 실적은 자재·소형 재고·컨테이너 개체에 자동 반영하지 않음. 자재출고·제품입고는 별도 기록.

## API 공통 계약

기본 경로 /api/production. 기존 HttpOnly 세션이 필요하며 변경에는 허용 Origin, X-ERP-Browser: 1, JSON 본문이 필요합니다. 성공은 200 JSON, 오류는 { detail }: 400 입력/날짜, 401 인증, 403 권한, 404 대상 없음, 409 중복·재고·상태·버전 충돌입니다.

모든 POST/PATCH에 request_id(영숫자/하이픈/밑줄 8~80자, UUID 권장)를 포함합니다. 작성자·동작·대상별 같은 식별자/입력의 재시도는 원 응답, 다른 입력은 409입니다. 재고·상태·감사·요청 결과는 하나의 트랜잭션에 저장하고 실패는 저장하지 않습니다.

PATCH는 폼 메타데이터 전체 저장이며 version은 최신 상세/목록 값을 전달합니다. 수불·실적은 트랜잭션 안에서 현재고·지시 상태를 검사합니다. 알 수 없는 본문 필드는 거부합니다.

목록은 { results, count }, page는 1부터, limit는 1~100(기본 20), ID 내림차순입니다. q는 문자열 검색, from/to는 YYYY-MM-DD(종료일 포함)입니다. 입력 기본 날짜는 한국 날짜, created_at은 서버 UTC epoch milliseconds입니다.

| 경로 | 지원 |
|---|---|
| items, items/:id | GET 목록/상세, POST 생성, PATCH 수정 |
| stock-movements | GET 수불 목록, POST 수불 |
| stock-movements/:id/reverse | POST 수불 취소 |
| containers, containers/:id | GET 목록/상세, POST 최초 입고, PATCH 정보 수정 |
| containers/:id/status | POST 점검/수리 |
| container-events | GET 개체별 이력 |
| container-events/:id/reverse | POST 마지막 회수/점검/수리 취소 |
| dispatches, dispatches/:id | GET 목록/상세(lines 포함), POST 복수 출고 |
| dispatches/:id/returns | POST 선택 회수 |
| dispatches/:id/reverse | POST 전체 출고 취소 |
| orders, orders/:id | GET 목록/상세, POST 생성, PATCH 수정 |
| orders/:id/status | POST 상태 전환 |
| results | GET 지시별 실적, POST 실적 |
| results/:id/reverse | POST 실적 취소 |

### 본문

공통 request_id 외 필드는 아래와 같습니다. 비고·규격·위치는 선택이고 빈 문자열로 생략할 수 있습니다.

- 품목 생성: kind(material/small/container), code, name, 자재 unit; 선택 specification/location/note/is_active. 제품은 EA 고정. 수정은 kind 제외, version 포함.
- 수불: item_id, kind, quantity, business_date; partner/note는 판매·조정 필수 조건 참고.
- 개체 최초 입고: item_id, serial, business_date; 선택 location/note. 수정: serial, location, note, version.
- 개체 상태: action, version, business_date, note.
- 출고: container_ids 정수 배열, partner, business_date; 선택 due_date/note.
- 회수: container_ids, business_date; 선택 note.
- 지시 생성: item_id, planned_quantity, due_date, assignee; 선택 note. 수정은 item_id 제외, version 포함.
- 지시 상태: status, version, note.
- 실적: order_id, business_date, good, defective; 선택 note.
- 모든 취소: business_date, note 필수.

### 목록 필터

각 목록은 q도 지원합니다.

| 목록 | 필터 |
|---|---|
| 품목 | kind, is_active |
| 수불 | item_id, item_kind, kind, from, to |
| 개체 | item_id, status |
| 출고 | status(open/closed), from, to |
| 지시 | status, from, to(납기 기준) |
| 실적 | order_id, from, to |
| 개체 이력 | container_id, from, to |

## 검증

`conda run -n scott npm test`는 실제 임시 PostgreSQL에서 생산부 업무와 API 회귀를 검증하고 해당 테스트 자원만 정리합니다. 운영 .env·DB·NAS에는 테스트 데이터를 넣지 않으며 날짜별 전체 개수와 결과는 [검증 기록](VALIDATION.md)을 따릅니다.

[개발 안내](NODE_REBUILD.md) · [AI 인수인계](AI_HANDOFF.md)
