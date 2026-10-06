(() => {
  "use strict";

  // 2026-10-06 전달 업무일지의 서비스 시작 전 점검 목록.
  // 각 점검은 1점이며 명시한 수용 기준 확인 완료만 점수를 준다.
  // 코드·격리 검증과 실제 운영 인수는 별도 점검으로 유지한다.
  const source = "2026-10-06 전달 업무일지";
  const groups = [
    {
      id: "1", name: "공통 기능", tag: "COMMON FOUNDATION", tone: "blue",
      summary: "인증·계정·공통 DB·감사·홈의 기초 기능",
      stream: "공통 기능 검증", goal: "서비스를 올릴 공통 기능과 저장 구조 확보",
      connection: "NAS 인증 → 세션·계정 → 공통 DB·홈",
      rows: [
        ["NAS 로그인·로그아웃", "NAS 직접 인증과 일반 계정의 LAN·공개 HTTPS 접속", "인증 API·로그인 화면", "실제 NAS 일반 계정 로그인·세션 조회·로그아웃 성공", "done", "업무 11·19: 실제 일반 계정 접속 검증"],
        ["계정·부서·프로필·세션", "NAS 신원과 계정 소속·프로필 저장, 세션 처리 유지", "계정·부서·세션 공통 처리", "격리 API에서 신원·계정·세션 계약 확인", "done", "업무 2·3·20: 공통 API 회귀 통과; 실제 관리자 변경은 3.1.5에서 확인"],
        ["공통 DB 7개 테이블", "업무 전용 구조를 제외하고 공통 스키마와 ERP 표식 유지", "사용자·부서·세션·메모·감사·이력·표식 테이블", "신규 DB 구성과 표식 없는 DB·최신 스키마 시작 거부 확인", "done", "업무 3·10·20: 격리 검사 및 운영 공통 7개 테이블 확인"],
        ["감사·현재 접속 현황", "감사 저장과 최근 활동·동일 계정 중복 제외 기준", "감사 기록·운영 현황", "격리 API에서 감사·접속 처리 회귀 확인", "done", "업무 2·20: 공통 감사·세션 검사 통과"],
        ["홈 달력·개인 메모", "월·날짜 이동, KST 오늘, 부서 선택, 개인 메모와 응답 순서 보호", "월간 달력·메모·서비스 준비 화면", "격리 API·합성 홈 화면에서 날짜·메모·모바일·지연 응답 확인", "done", "업무 8·9·20: 합성 홈 화면 31/31; 공휴일은 4.1.5에서 별도 확인"]
      ]
    },
    {
      id: "2", name: "보안·접근", tag: "SECURITY & ACCESS", tone: "violet",
      summary: "관리 권한·초기 암호·TLS 정책·문서 접근·쿠키",
      stream: "보안 경계 검증", goal: "코드와 현재 접속 경로의 보안 조건 확인",
      connection: "인증 → 역할 검사 → 허용된 화면·API",
      rows: [
        ["초기 관리자 암호 정책", "약한 기본 암호 예외 제거 및 기존 계정 상태 보존", "초기 계정 정책", "12–128자 정책·빈 사용자 DB에서만 생성·재시작 보존 검사", "done", "업무 6·20: 격리 API 회귀 통과"],
        ["관리 API 권한 경계", "관리 경로와 변경 트랜잭션에서 역할 재확인", "관리 API·세션 폐기·마지막 관리자 보호", "격리 역할 검사와 실제 일반 계정 403·비인증 401·루트 관리 API 404 확인", "done", "업무 6·17·19·20: 실제 접근 거부 및 격리 보호 검사; 실제 변경 인수 별도"],
        ["분리 배포 보안 코드", "API HTTPS·검증 DB TLS·명시 프록시·Origin 조건 준비", "연결 검증 코드·프록시 템플릿", "잘못된 인증서·신뢰 대상·DB 우회 설정 거부를 코드 검사로 확인", "done", "업무 5·20: 격리 API·모의 Docker 통과; 실제 세 PC 적용은 4.1.4에서 확인"],
        ["로그인 문서 접근 보호", "생성 HTML 허용 목록, 경로·파일·CSP·세션 경계", "문서 API·/md 화면·안전 HTML 11개", "생성기 5/5·모의 화면 37/37 및 실제 로그인 문서 열람·로그아웃 후 401 확인", "done", "업무 12–16·19·20: 실제 공개 문서 확인"],
        ["공개 HTTPS·쿠키 경계", "ERP와 /admin/ 경로·쿠키를 분리하고 공개 포트 제한 유지", "HTTPS 프록시·쿠키 정책", "실제 HTTPS의 Secure·HttpOnly·Path 및 관리자 SameSite Strict 확인", "done", "업무 17·19: 실제 쿠키·경로·접속 제한 확인"]
      ]
    },
    {
      id: "3", name: "DB·복구", tag: "DATA & RECOVERY", tone: "orange",
      summary: "백업 코드·배포 보존·외부 저장·복원·관리자 인수",
      stream: "데이터 보호와 인수", goal: "검사한 복구 코드가 실제 운영 경로에서도 동작하는지 확인",
      connection: "DB → 서명 백업 → HDD·NAS → 운영 복원",
      rows: [
        ["서명 백업·복원 격리 검사", "v8/v9 호환·안전 백업·서명·해시·표식·잠금·실패 롤백", "백업·복원 검증 코드", "격리 DB에서 호환·거부·트랜잭션·세션 폐기·실패 롤백 회귀 통과", "done", "업무 4·20: 격리 API 통과; Linux 운영 복원은 3.1.4에서 확인"],
        ["앱 배포 시 DB·설정 보존", "DB와 점검 서비스 유지, 기존 계정·NAS 신원·키·설정 보존", "앱 교체 실행기·배포 대조 기록", "실제 배포 전후 테이블·계정·신원·DB 컨테이너 및 설정 동일성 확인", "done", "업무 18·19: 후속 앱 배포에서 공통 7개 테이블·계정 24개 보존"],
        ["Linux HDD·NAS 백업 저장", "실제 외부 경로 마운트와 원본·사본 쓰기 확인", "HDD 원본·NAS 사본·경로 검사 기록", "운영 Linux에서 실제 마운트·파일 저장·사본 일치 확인", "in_progress", "업무 4·20 및 남은 확인: 보호 코드 준비; 실제 HDD/NAS 성공 인수 남음"],
        ["Linux 운영 복원 인수", "실제 외부 백업으로 복원·실패 복구와 원본 보존 확인", "운영 복원·롤백 인수 기록", "승인된 운영 조건에서 실제 백업 복원과 실패 복구 확인", "in_progress", "남은 확인: Windows의 Linux 전용 제외 결과는 운영 성공 근거가 아님"],
        ["관리자 실제 변경·백업 인수", "관리자 계정으로 계정·부서 변경과 백업 생성·복원 확인", "관리자 운영 인수 기록", "실제 관리자 권한의 변경·백업·복원 동작과 보호 조건 확인", "in_progress", "업무 6·19: 격리 검사 완료; 일반 계정 132개 확인에 관리자 실제 작업은 미포함"]
      ]
    },
    {
      id: "4", name: "배포·운영 준비", tag: "RELEASE READINESS", tone: "green",
      summary: "회귀 검사·현재 배포·독립 실행기·분리 이전·공휴일",
      stream: "서비스 시작 전 운영 준비", goal: "현재 배포 근거를 확보하고 남은 운영 조건 적용",
      connection: "코드 검사 → 배포 → 실제 접속 → 운영 준비",
      rows: [
        ["공통 코드·화면 회귀", "API·웹·관리자 build/lint와 격리·모의 화면 검사", "검사 결과·의존성 감사", "전체 build/lint·격리 API·웹 41/41·모의 Docker 20/20 및 의존성 감사 0건", "done", "업무 20: Windows/scott 통과, Linux 전용 13 제외; 운영 검증과 구분"],
        ["현재 앱 배포·일반 계정 확인", "현재 단일 호스트 앱 healthy와 LAN·공개 문서·관리 접속 경계", "실제 배포·접속 확인 기록", "API·웹·관리자 healthy와 실제 NAS 일반 계정 132개 확인·JS 오류 0", "done", "업무 18·19: docs-admin-r2 앱 배포 및 실제 공개 확인"],
        ["분리 호스트 독립 실행기", "DB·API·웹을 각각 실행·점검·복구할 실행기 준비", "세 호스트 실행·점검·복구 절차", "각 호스트에서 독립 시작·건강 확인·복구 동작 검증", "planned", "업무 5 및 다음 업무: 현재 실행기는 동일 Docker 호스트 기준; 독립 실행기 미완료"],
        ["세 PC 인증서·망·이전", "실제 대상 주소·인증서·방화벽·DB 이전·관리 경로 적용", "세 PC 운영 구성·이전 확인", "세 PC 간 검증 TLS 접속·최소 망 허용·데이터 대조·관리 접근 확인", "in_progress", "업무 5: 보안 코드·템플릿 준비; 실제 PC 이전·인증서·방화벽 적용 남음"],
        ["공휴일 API 월간 동기화", "홈 달력의 공식 공휴일 수집·캐시·월간 갱신", "공휴일 API 연결·월간 동기화", "해당 월 공휴일 표시·재수집·캐시·API 실패 처리 검증", "planned", "업무 8 및 다음 업무: 공휴일 API·월간 수집 미구현"]
      ]
    }
  ];

  groups.forEach(group => {
    const stream = {
      id: `${group.id}.1`, name: group.stream, goal: group.goal, connection: group.connection,
      tasks: group.rows.map(([title, description, deliverables, acceptance, status, evidence], index) => ({
        id: `${group.id}.1.${index + 1}`, title, description, deliverables, acceptance, status,
        evidence: `${source} · ${evidence}`, groupId: group.id, groupName: group.name,
        streamId: `${group.id}.1`, streamName: group.stream, connection: group.connection
      }))
    };
    group.streams = [stream];
    delete group.rows;
  });
  const tasks = groups.flatMap(group => group.streams.flatMap(stream => stream.tasks));
  function calculateProgress(items) {
    return items.length ? Math.round(100 * items.filter(task => task.status === "done").length / items.length) : 0;
  }
  window.WBS_DATA = {
    updateDate: "2026-10-06", progressBasis: "프로토타입 단계까지의 기반 준비",
    overallProgress: { estimate: 7, basis: "준비한 기본 기능과 앞으로 구현할 서비스 전체", source: "2026-10-06 사용자 추정" },
    calculateProgress, currentProgress: calculateProgress(tasks), groups, tasks,
    completed: tasks.filter(task => task.status === "done"),
    handoffs: [
      { from: "공통 기능", to: "보안 경계", title: "인증·DB → 접근 보호", detail: "NAS 신원과 공통 저장 구조 위에 역할·문서·TLS 정책 검증" },
      { from: "백업 코드", to: "운영 인수", title: "격리 검사 → 실제 복구", detail: "서명·롤백 코드 검사 후 Linux HDD/NAS 저장과 복원 확인" },
      { from: "현재 배포", to: "분리 운영", title: "접속 확인 → 세 PC 준비", detail: "현재 단일 호스트 검증에 이어 독립 실행기·인증서·방화벽·이전 확인" }
    ]
  };
})();
