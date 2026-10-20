(() => {
  "use strict";

  // Implementation records are separate from completion of the three departments.
  // ERP working-tree changes are excluded; freeze evidence at this revision.
  const sourceCommit = "6a016b4c967b06bd9d17caabca6b4b66c5a78116";
  const groups = [
    {
      id: "1", name: "공통 기능", tag: "COMMON", tone: "blue",
      summary: "NAS 인증·계정·DB·감사·부서 달력·개인 메모",
      connection: "NAS 신원 → 세션·권한 → 공통 데이터·화면",
      rows: [
        ["NAS 로그인·로그아웃", "DSM 직접 인증·소속 재확인·세션", "인증 API·로그인", "공개 HTTPS에서 실제 NAS 로그인·세션·로그아웃 확인", "done", "VALIDATION.md: 10월15일 r3 실제 NAS 로그인·공개453개 확인"],
        ["계정·부서·프로필·세션", "연동/로컬 계정 분리·생성/비활성/삭제·프로필", "계정·부서 관리", "격리 검사로 자기/마지막 관리자·참조 보존·세션 보호 확인", "done", "0c76221·096be05: 로컬 계정 정책·담당 권한; 실변경 인수는 3.1.5"],
        ["공통·업무 DB와 호환 구조", "개발47표/v9·제품/QC5·개인 읽음1·사업9·로거1 추가", "DB 표식·스키마·v8/v9 호환", "격리 스키마·선택 모듈 없는 구서명·복원/이전 보존 대조", "done", "DATABASE_README.md·VALIDATION.md: 개발47표, 마지막 운영 dashboard-r1은31표/v9. 개발 후속 미배포"],
        ["감사·현재 접속 현황", "작업자·시각·동작·변경 전후 검색과 최근 활동", "작업 로그·접속 현황", "격리 API에서 조회 권한·감사 원문·중복 계정 제외 확인", "done", "0c76221·096be05: 감사 표시·검색 개선, 개인 메모 보호 유지"],
        ["부서 달력·개인 메모·알림 읽음", "그룹별 첫 대시보드·계정별 DB0/1·개인 메모·응답 보호", "대시보드·달력·개인 알림", "GET 무쓰기·읽음 원자 저장/계정 격리·구서명·지연 응답 회귀", "done", "6a016b4·VALIDATION.md: 알림83·대시보드270 모의 항목. 실제 읽음1 재저장/새로고침 확인, 실제0→1·재로그인 미확인"]
      ]
    },
    {
      id: "2", name: "보안·접근", tag: "SECURITY", tone: "violet",
      summary: "관리 권한·암호·TLS·개발 문서·공개 접속 경계",
      connection: "인증 → 역할·소속 검사 → 허용된 API",
      rows: [
        ["초기 관리자·로컬 암호 정책", "빈 DB 초기 관리자·로컬 생성 정책·기존 암호 보존", "암호·생성 보호", "초기12~128자·로컬6~128자 영문/숫자·충돌/재시작 보존 회귀", "done", "0c76221: 로컬 생성2회 확인; NAS/기존 암호 변경 정책 유지"],
        ["관리·부서 API 권한 경계", "실제 소속·개별 업무 권한·회수 후 동일 UUID재검사", "권한 검사·세션 폐기", "QC·사업/물류·분류/단위 권한과 회수 후 UUID 재확인 거부 회귀", "done", "d6b1d2a·6a016b4: can_* 업무 권한·선택 부서로 권한 취득 금지·QC 타부서403·이력 범위 보호. 일반 계정 현업 인수 별도"],
        ["분리 배포 보안 코드", "API HTTPS·검증 DB TLS·명시 프록시·Origin 준비", "연결 검증·템플릿", "잘못된 인증서·신뢰 대상·DB 우회 설정 거부 검사", "done", "SPLIT_HOST_SECURITY.md: 코드 준비; 실제 세 PC 적용은 4.1.4"],
        ["개발 문서·운영 제외 경계", "개발 허용 목록·본문 정화·운영 파일/메뉴/라우트 제외", "개발 기술 소개·문서 보호", "개발 회귀와 운영 /md·문서 API의 인증/익명404 확인", "done", "6c72d60·f3f6458: 문서12개 검사·r3 문서404 확인"],
        ["공개 HTTPS·쿠키 경계", "ERP/관리자 경로·Secure/HttpOnly·공개 포트 제한", "HTTPS 프록시·쿠키", "실제 공개 HTTPS의 경로·쿠키·접근 제한 대조", "done", "VALIDATION.md: r3 공개453개/오류0·NAS 직접 인증 보존"]
      ]
    },
    {
      id: "3", name: "DB·복구·현업 인수", tag: "RECOVERY", tone: "orange",
      summary: "서명 백업·자료 보존·HDD/NAS·운영 복원·현업 수용",
      connection: "DB → 서명 백업 → HDD·NAS → 복구·현업 인수",
      rows: [
        ["서명 백업·복원 격리 검사", "47표·선택 v9·구 v8/v9 원문·잠금·원자 복원", "서명/체인·복원 회귀", "사업부 참조 시 생산 단독 복원/전체 이전 거부·읽음/로거 호환 회귀", "done", "6a016b4·DATABASE_README.md: 모듈 없는 구서명 원문과 해시 보존, 기본정보 전용 이전8개 검사. 실제 운영 복원 아님"],
        ["앱 배포·승인 이전의 자료 보존", "앱 교체와 승인 기본정보 이전 구분·기존 행/키 보존", "배포/이전 전후 대조", "보호열·기존행·기존백업 보존과 승인/인증 시각 변화 설명", "done", "VALIDATION.md dashboard-r1: 계정25·메모1·운영31표·기존백업865/신규2 보존. 개발 자료 이전/운영 덮어쓰기 없음. 10/19는격리 이전검사만"],
        ["Linux HDD·NAS 백업 저장", "NAS 실제 저장·서명 일치 확보, HDD 원본 전환 남음", "HDD 원본·NAS 사본", "운영 Linux의 HDD 전환과 원본/사본 저장·일치 인수", "in_progress", "VALIDATION.md: r3 전체/증분 NAS 저장·영구 이벤트 대기0; HDD 전환 완료 근거 없음"],
        ["Linux 운영 복원 인수", "외부 백업 신규 복구·실패 복구·자료 대조", "복원·롤백 인수", "승인된 운영 조건에서 실제 백업 복원과 실패 복구 확인", "in_progress", "PROJECT_STATUS.md: 운영 복원 인수 남음. 격리 검사·NAS 저장을 복원 성공으로 확대하지 않음"],
        ["관리자·부서 업무 현업 인수", "일반 부서별 계정·실제 업무/수량·파일/인쇄·실기기", "업무·기기 수용 기록", "정상/거부·수량/예외·복구·iOS/Android 촬영 현업 확인", "in_progress", "VALIDATION.md 10/19: 관리자 세션의 개발 TEST QC·소형 분할출고·2대 신청/승인 확인. 일반 계정 인수·PC 저장/Excel·카메라/복원 미확인"]
      ]
    },
    {
      id: "4", name: "배포·운영 준비", tag: "OPERATIONS", tone: "green",
      summary: "회귀·단일 서버 배포·독립 실행기·세 PC 이전·공휴일",
      connection: "코드 검사 → 앱 배포 → 운영 확장",
      rows: [
        ["공통 코드·화면 회귀", "API·웹·관리자 빌드/정적 검사·영향 범위 회귀", "검증 기록", "변경 범위의 빌드·회귀·모의 결과와 실패/제외 구분", "done", "6a016b4 최신QA: API432중419통과/13Linux생략·웹199·도구45중44/1생략·합성UI540/오류0·격리실제UI35/다운로드13 별도. 신규 운영 검사 아님"],
        ["단일 서버 배포·일반 계정 확인", "운영 앱 healthy·NAS 로그인·권한", "앱 배포·공개 확인", "API·웹·관리자 healthy·실제 NAS 로그인·문서 제외 확인", "done", "1ed63d4·VALIDATION.md: 마지막 문서상 20261016-dashboard-r1·3앱 healthy·NAS보안457. 운영 새 카드 관리자 실클릭 미확인, 10/19 개발 후속 미배포"],
        ["분리 호스트 독립 실행기", "DB·API·웹 각각의 시작·health·교체·복구", "세 호스트 실행/복구", "각 호스트 독립 실행과 부분 장애·복구 검증", "planned", "PROJECT_STATUS.md: 현재 동일 Docker 호스트, 독립 실행기 미완료"],
        ["세 PC 인증서·망·이전", "주소·TLS 인증서·방화벽·DB 이전·관리 경로 적용", "세 PC 운영 구성", "실제 검증 TLS·최소 망·자료/계정 대조·접근 거부 확인", "in_progress", "PROJECT_STATUS.md: 코드/수동 템플릿 준비, PC 이전·인증서·방화벽 남음"],
        ["공휴일 API 월간 동기화", "공식 API 수집·저장·캐시·월간 갱신·달력 표시", "공휴일 동기화", "월 표시·재수집·캐시·API 실패 처리 확인", "planned", "PROJECT_STATUS.md: 대한민국 공휴일 API·월간 수집 미구현"]
      ]
    },
    {
      id: "5", name: "생산 자재관리", tag: "MATERIALS", tone: "blue",
      summary: "엑셀 자재·등록 대기·정밀 입출고·분류·첨부·기록",
      connection: "원본 엑셀 → 자재/대기 → 입출고 → 감사·백업",
      rows: [
        ["자재 CRUD·등록 대기", "모호한 항목 대기·이름/치수 분리·모델명 보존", "자재 목록·상세·대기", "격리/모의 등록/수정/삭제·대기 확정·미확정값 보존 검사", "done", "ba0bf99·466671e·0c76221: BOM/자동 생산/완제품 전용 출고 제거 후 엑셀 흐름 유지"],
        ["정밀 수량·단건/일괄 입출고", "실제 단위·전후 수량·최대100개·원자 처리·UUID", "입고·출고·기록", "부족/미입력/버전 거부·중복 재확인·전체 롤백 회귀", "done", "0c76221·096be05: 일괄 입출고·결과 불명 원문/UUID 보존; 실업무 인수는 3.1.5"],
        ["분류·치수·랙·단위·안전재고 권한", "검색 선택·카탈로그 교정·사용 중 삭제 거부·안전재고", "분류 관리·권한", "실제 생산부의 개별 수정/삭제 권한·참조/버전·null 회귀", "done", "d6b1d2a·6a016b4: 단위 포함8메뉴·치수 추가는 수정 권한 통합·종류 삭제 관리자만·사용 중 삭제 거부·과거 이력/원본 보존"],
        ["원본 엑셀·사진/파일 첨부", "3종 엑셀 구조 보존·업로드/다운로드·첨부 유지/해제", "엑셀·원본 연결·첨부", "병합/스타일/인쇄·누락/충돌 거부·첨부/백업 회귀", "done", "ba0bf99·0c76221: 원본 보존·미확정 대기; 수량8/0 충돌 등 현업 확인은 3.1.5"],
        ["작업 로그·알림·검색·재고 대시보드", "자재4카드 필터·재고/구매필요/대기·작업자/증감·개인 읽음", "기록·대시보드·검색·달력", "카드/목록/전체 건수·소수/미입력0·검색/페이지·권한 회귀", "done", "1ed63d4: API42·모의235/오류0·dashboard-r1 배포. 6a016b4: material_id 정확조회로 이름변경/검색50건 밖 소형 출고 정정 보완"]
      ]
    },
    {
      id: "6", name: "생산 물류", tag: "LOGISTICS", tone: "green",
      summary: "LOT 자산·소유사·로거·출고/에이징·반입/클리닝/AS",
      connection: "컨테이너 → 준비·에이징 → 출고 → 반입·클리닝·AS",
      rows: [
        ["LOT 자산·CSV·소유사", "LOT당1대·6열 기본CSV·생산일/소유사·별도 일정", "기본정보·소유사", "중복·최대100대·권한/버전·참조 삭제 거부·원자 처리 검사", "done", "6a016b4·UI_GUIDE.md: LOT/생산일/소유사/로거/검교정/차기검교정6열 유지, 입출고 예정은 별도 일정. 과거4열기록과 구분"],
        ["독립 로거 등록·연결·이력", "미연결 등록·LOT 1:1 연결/교체/해제·2열XLSX", "로거 등록부·이력·보고서", "최대1000행/5MiB 미리보기·원문해시/버전·전체롤백·권한회수/UUID 회귀", "done", "6a016b4: logistics_data_loggers 추가·기존권한/검교정/신청스냅샷 보존·집중API22/모의33. 실제신규저장·파일업로드 인수 없음"],
        ["출고 준비·PCM 에이징·사진", "준비→에이징→사진 저장→명시적 완료→실제 출고·도착일", "출고 단계·사진·UUID 복구", "단계 우회/사진 누락/타부서 거부·일괄 롤백·과거 UUID 회귀", "done", "7a1a6c2·fd0d4aa: 사진 저장과 에이징 완료 분리·과거 UUID 보호·운영 polish-r1 배포. 현업 수용은 미완료"],
        ["반입·클리닝·생산팀 AS", "반입사진→클리닝→검수→보관/AS→완료사진→물류 복귀", "입고·클리닝·AS", "단계 건너뛰기/중복 거부·최초 외부 반입만 원장1회 검사", "done", "096be05·f3f6458: 입고/AS 모의80·사진/단계/기존 수량 보존; 실기기/현업은 3.1.5"],
        ["물류 대시보드·일정·제품/AS 이력", "종류/소유사 카드·상태 필터·QC 통과 후 보관·물류전용 이력", "대시보드·달력·알림", "카드/목록 건수·QC미통과 제외·기존보관 호환·담당 이력/사진 권한 회귀", "done", "36b52c4·6a016b4: QC신청/인수 재고 제외·통과 후 동일ID 보관·사업부 고객번호/예정시간/개별로거 연결. 운영 새 카드 실클릭·실촬영 인수 별도"]
      ]
    },
    {
      id: "7", name: "사업팀 업무", tag: "BUSINESS", tone: "orange",
      summary: "컨테이너·소형 신청·결산·XLSX 구현, 해외구매/현업 인수 보류",
      connection: "사업부 신청 → 물류/생산 처리 → 이력·컨테이너 결산",
      rows: [
        ["컨테이너 입출고 신청·물류 승인", "고객 요청번호별 최대100대·예정일시·개별 로거·재승인", "사업부3메뉴·묶음·원본 첨부", "실제 계정별 신청/승인·중복/우회 거부·일부 처리/취소 수용", "in_progress", "6a016b4·VALIDATION.md: 시험2대 신청/제출/물류승인 실제 개발 확인. 에이징/실출고는 격리 검사, 일반 계정 인수 남음"],
        ["소형 신청·분할 계획·실제 출고", "계획은 무차감·실제 출고만 차감·정정/원실적 보존", "소형 신청·생산부 계획/실적", "계획/신청 잔량·재고·동시처리·정밀수량·정정/월경계 수용", "in_progress", "6a016b4·VALIDATION.md: 개발 시험자재104 입고6→출고2/4→재고0. 계획 초과/신청 축소 거부·정확 material_id 조회 보완, 일반 계정/다른 실적일 미확인"],
        ["컨테이너 월말결산·요율", "컨테이너 입출고·렌탈1/2·보관5종·소형 제외", "단가·정산 XLSX/ZIP·개정 이력", "미확정 계약/요율 차단·월경계·원월 개정/이전판·실제 금액/출력 수용", "in_progress", "6a016b4·PROJECT_STATUS.md: 사업부9표·결산 구현/격리 검사, 소형 과거자료 보존/목록·다운로드 제외. 실제 단가/정산파일 현업 인수 없음"],
        ["원본 양식·신청서 XLSX 다운로드", "고객번호·시간·각 LOT/로거·반복시트·원본 서식/인쇄영역", "신청서·직접 저장 링크", "OOXML·응답길이/형식·창/계정 변경 보호·실제 PC 저장/Excel 표시·인쇄 수용", "in_progress", "6a016b4·VALIDATION.md: 격리 HTTP 일반탭/로그인유지 각9674바이트·13항목 통과. 실제 개발 세션 파일 회수 시간초과·PC 저장/Excel 미확인"],
        ["해외구매 잔여 요구·현업 인수", "해외구매20단계·발주/비교·결의/검수·수입/송금 기준", "확정 요구·서식·부서별 수용 기록", "남은 입력/서식/가격·담당/승인 확정과 일반 사업부/생산/물류 계정 수용", "in_progress", "6a016b4·PROJECT_STATUS.md: 신규 신청/결산과 해외구매20단계 요청은 별개. 미제공 양식/송금 기준·현업 인수를 구현 완료로 대체하지 않음"]
      ]
    },
    {
      id: "8", name: "기술개발 업무", tag: "ENGINEERING", tone: "violet",
      summary: "QC 인수/통과 구현·담당 이력 분리, 장비/XML 범위 보류",
      connection: "생산 완료·QC 신청 → 기술개발 인수/통과 → 물류 보관",
      rows: [
        ["QC 신청·인수·통과·물류 보관", "생산 완료/신청은 생산부·인수/통과는 기술개발부", "QC 관리·대시보드·단계 이력", "실제 담당 계정·생산LOT/완료일·타부서 거부·QC통과 재고 편입 수용", "in_progress", "6a016b4·VALIDATION.md: 개발 TEST QC1대 실제 신청→인수→통과/보관 및 새로고침 유지. 관리자 세션 단계 검사이며 일반 기술개발부 인수 아님"],
        ["QC 권한·조회 범위·제품 이력", "신청/인수/완료·50건 페이지·이전LOT·물류전용 제품/AS 이력", "담당 화면/API·권한·물류 연결", "QC미통과 재고/출고 제외·기존 보관 호환·직접URL/API 거부·재확인 수용", "in_progress", "6a016b4·VALIDATION.md: 제품흐름 격리API/DB 브라우저35항목·권한/이력 보호. 일반 계정 현업·운영 적용 별도"],
        ["샘플·XML 측정 자료 연계", "샘플 식별·XML 원본/측정값·추적 연계 범위 확정", "확정 자료 연계", "원본/중복·신원/권한·측정값 대조와 ERP 연계 수용", "planned", "VIP_sample.md는 독립 뷰어/수집기 설명. 신규 QC 구현이 XML·실장비 연계 완료 근거는 아님"],
        ["장비·시험·일정 범위", "필요 장비·예약/충돌·시험/판정·결과 출력의 범위 확정", "승인 장비/시험·일정 설계", "마스터/담당자가 요구·예외·권한 확정 후 실장비 수용", "planned", "PROJECT_STATUS.md: 과거 챔버·예약·VIP 시험 제거 이력 유지, 현행 QC 이외 신규 장비업무 구현 근거 없음"],
        ["기술개발 연계·현업 인수", "QC/생산/물류 연계·운영 적용·일반 계정·실장비/자료 수용", "연계·운영 인수", "실제 담당 계정의 정상/거부·장비/사진·실패 복구·현업 확인", "in_progress", "VALIDATION.md: 개발 TEST QC 연결 확인. 신규47표 운영 배포·일반 부서 계정·실기기·운영 복원 인수 미확인"]
      ]
    }
  ];

  groups.forEach(group => {
    group.streams = [{
      id: `${group.id}.1`, name: group.name, goal: group.summary, connection: group.connection,
      tasks: group.rows.map(([title, description, deliverables, acceptance, status, evidence], index) => ({
        id: `${group.id}.1.${index + 1}`, title, description, deliverables, acceptance, status,
        evidence: `ERP ${sourceCommit.slice(0, 7)} 기준 · ${evidence}`,
        groupId: group.id, groupName: group.name, streamId: `${group.id}.1`,
        streamName: group.name, connection: group.connection
      }))
    }];
    delete group.rows;
  });
  const tasks = groups.flatMap(group => group.streams.flatMap(stream => stream.tasks));
  const stages = [
    { id: "requirements", name: "요구사항", weight: 10 },
    { id: "design", name: "업무 설계", weight: 20 },
    { id: "implementation", name: "기능 구현", weight: 40 },
    { id: "verification", name: "업무 검증", weight: 20 },
    { id: "acceptance", name: "현업 인수", weight: 10 }
  ];
  const stageScores = { planned: 0, partial: 0.5, done: 1 };
  const departments = [
    {
      id: "production", name: "생산부", status: "in_progress", detail: "자재·물류·소형 출고·QC 신청 구현, 현업 인수 남음", groupIds: ["5", "6"], tone: "blue",
      stages: {
        requirements: { status: "partial", evidence: "자재 원본·물류 요청 정리 및 단계 확정. 수량 충돌·등록 대기·부서 전체 범위 확인 남음", source: "PROJECT_STATUS.md·생산물류팀_업무요구사항.md" },
        design: { status: "partial", evidence: "자재 입출고·LOT/로거·출고/반입/AS 흐름 설계. 부서 전체 업무 설계 확정 전", source: "AI_HANDOFF.md·DATABASE_README.md" },
        implementation: { status: "partial", evidence: "자재·물류·독립로거·소형 분할출고·생산완료/QC신청 구현. 부서 전체 완료 아님", source: "6a016b4·PROJECT_STATUS.md·erp-api/src/product-lifecycle.ts" },
        verification: { status: "partial", evidence: "dashboard-r1 운영 기록과 격리/모의 QA·실제 개발 TEST QC/분할출고 확인. 일반 계정·기기/복원 수용 남음", source: "VALIDATION.md: 최신QA·실제 개발 QC/소형 검증" },
        acceptance: { status: "planned", evidence: "관리자 세션 개발 시험과 일반 부서 계정의 현업 인수는 구분. 부서 인수 완료 기록 없음", source: "VALIDATION.md: 2026-10-19 QA 한계" }
      }
    },
    {
      id: "7", name: "사업부", status: "in_progress", detail: "컨테이너·소형 신청·월말결산 구현, 현업 인수 남음", groupIds: ["7"], tone: "orange",
      stages: {
        requirements: { status: "partial", evidence: "컨테이너/소형 신청·컨테이너5종 결산 요구 일부 확정. 해외구매20단계·서식/송금 잔여 기준은 별도", source: "6a016b4·PROJECT_STATUS.md·UI_GUIDE.md" },
        design: { status: "partial", evidence: "신청→재승인→물류/생산 처리·개별 로거/원본서식·결산개정 흐름 설계. 부서 전체 설계 미확정", source: "DATABASE_README.md·erp-api/src/business-requests.ts" },
        implementation: { status: "partial", evidence: "사업부3메뉴·9표·신청/첨부/XLSX·소형분할·컨테이너 결산 구현. 전체 해외구매 업무 완료 아님", source: "6a016b4·PROJECT_STATUS.md·erp-web/apps/web/src/views/BusinessView.vue" },
        verification: { status: "partial", evidence: "최신 격리QA·모의사업부71항목·관리자 개발2대신청/승인·소형2/4출고 확인. 실제PC파일/일반계정 수용 남음", source: "VALIDATION.md: 최신QA·컨테이너/소형 실제 개발 기록" },
        acceptance: { status: "planned", evidence: "일반 사업부/물류/생산 계정의 현업 인수·운영 적용·실제금액/Excel 인수 기록 없음", source: "VALIDATION.md: 2026-10-19 QA 한계" }
      }
    },
    {
      id: "8", name: "기술개발부", status: "in_progress", detail: "QC 인수·통과 구현, 장비/XML·현업 인수 남음", groupIds: ["8"], tone: "violet",
      stages: {
        requirements: { status: "partial", evidence: "생산 완료→기술개발 QC인수/통과→물류보관의 담당/흐름 일부 확정. 장비/XML/샘플 범위 미확정", source: "6a016b4·PROJECT_STATUS.md·UI_GUIDE.md" },
        design: { status: "partial", evidence: "QC대기 재고제외·통과 후 보관·담당별 조회/이력 설계. 부서 전체 시험/판정 설계 완료 아님", source: "DATABASE_README.md·erp-api/src/product-lifecycle.ts" },
        implementation: { status: "partial", evidence: "QC 관리/대시보드·인수/통과·권한/기존보관 호환 구현. XML/장비연계 미구현", source: "6a016b4·erp-web/apps/web/src/views/ProductsView.vue" },
        verification: { status: "partial", evidence: "격리API/실제빌드35항목·개발 TEST QC1대 신청/인수/통과/보관 확인. 일반 담당 계정/실장비 미확인", source: "VALIDATION.md: QC 실제 개발 기록·최신QA" },
        acceptance: { status: "planned", evidence: "현재 관리자 세션의 단계 검사는 일반 기술개발부 계정의 현업 인수 아님. 운영/장비 인수 기록 없음", source: "VALIDATION.md: 2026-10-19 QA 한계" }
      }
    }
  ];
  function calculateLegacyDepartmentProgress(department) {
    return stages.reduce((sum, stage) => sum + stage.weight * stageScores[department.stages[stage.id].status], 0);
  }
  function calculateLegacyProgress(items) {
    return items.length ? Math.round(items.reduce((sum, department) => sum + calculateLegacyDepartmentProgress(department), 0) / items.length) : 0;
  }
  departments.forEach(department => { department.progress = calculateLegacyDepartmentProgress(department); });
  // Owner assessment takes precedence over the previous stage-weight estimate.
  departments[0].progress = null;
  departments[0].detail = "자재·물류 업무 개발 중. 완성도 수치는 별도 확인";
  departments[1].progress = 0;
  departments[1].status = "planned";
  departments[1].detail = "완성도 0%. 개발 기록과 완성 판정은 별도";
  departments[2].progress = 0;
  departments[2].status = "planned";
  departments[2].detail = "완성도 0%. 개발 기록과 완성 판정은 별도";
  const currentProgress = 10;
  window.WBS_DATA = {
    updateDate: "2026-10-20", sourceCommit, progressBasis: "2026-10-20 마스터 완성도 평가: 전체 약 10%, 사업부 0%, 기술개발부 0%",
    foundationAssessment: { progress: 7, source: "2026-10-20 마스터: ERP 초기 기초 뼈대 약 7%. 전체 10%와 합산하지 않음" },
    simulation: { progress: 100, status: "done", source: "2026-10-16 마스터 완료 확인" },
    overallProgress: { value: currentProgress, basis: "마스터의 전체 완성도 추정. 부서별 평균으로 역산하지 않음", source: "2026-10-20 마스터 직접 정정" },
    stages, stageScores, calculateLegacyDepartmentProgress, calculateLegacyProgress, currentProgress, departments, groups, tasks,
    completed: tasks.filter(task => task.status === "done"),
    handoffs: [
      { from: "부서별 개발 검증", to: "현업 인수", title: "QC·신청·분할출고 → 일반 계정 수용", detail: "담당별 계정·실제 수량/금액·PC파일/인쇄·기기 촬영 확인" },
      { from: "NAS 백업", to: "복원 인수", title: "실제 저장 → 운영 복구", detail: "HDD 전환·빈 내부 저장소 복구·운영 복원 확인" },
      { from: "남은 부서 요구", to: "다음 구현", title: "해외구매·장비/XML 범위 확정", detail: "신청/결산·QC 외 잔여 요구/서식·장비연계와 완료 기준 확정" }
    ]
  };
})();
