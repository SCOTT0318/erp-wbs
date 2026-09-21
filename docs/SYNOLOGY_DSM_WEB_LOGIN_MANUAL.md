# Synology DSM 계정·사용자·그룹 연동 매뉴얼

## 1. 목표

Synology DSM을 웹 애플리케이션의 사용자 인증 및 사용자 디렉터리로 사용한다.

구현할 기능:

1. DSM 아이디와 비밀번호를 사용한 로그인
2. DSM 사용자 목록 조회
3. 사용자 설명 및 이메일 조회
4. DSM 그룹 목록 조회
5. 그룹 설명 조회
6. 그룹별 소속 사용자 조회
7. 로그인한 사용자의 소속 그룹 조회

예상 결과:

```json
{
  "users": [
    {
      "uid": 1026,
      "name": "user01",
      "description": "홍길동 / 개발팀",
      "email": "user01@example.com",
      "groups": [
        "users",
        "developers"
      ]
    }
  ],
  "groups": [
    {
      "gid": 65536,
      "name": "developers",
      "description": "개발팀",
      "members": [
        {
          "uid": 1026,
          "name": "user01",
          "description": "홍길동 / 개발팀"
        }
      ]
    }
  ]
}
```

---

## 2. 중요 권한 사항

DSM 로그인 API는 일반 사용자도 호출할 수 있지만, 전체 사용자와 그룹 정보를 조회하는 API는 일반적으로 **관리자 권한이 필요하다.**

사용할 API:

| 기능 | API |
|---|---|
| 로그인 | `SYNO.API.Auth` |
| 사용자 목록 | `SYNO.Core.User` |
| 그룹 목록 | `SYNO.Core.Group` |
| 그룹 구성원 | `SYNO.Core.Group.Member` |
| API 지원 여부 확인 | `SYNO.API.Info` |

다음 두 가지 운영 방식을 선택할 수 있다.

### 방식 A: DSM 관리자만 웹페이지 사용

웹페이지에 로그인한 DSM 계정이 관리자 그룹에 속한 경우 해당 DSM 세션으로 사용자와 그룹을 조회한다.

```text
DSM 관리자 로그인
  ↓
DSM SID 발급
  ↓
사용자·그룹·구성원 조회
  ↓
DSM 로그아웃
  ↓
웹 애플리케이션 세션 발급
```

장점:

- 별도의 서비스 계정 불필요
- 구현이 비교적 간단함

단점:

- 일반 DSM 사용자는 전체 사용자와 그룹을 조회할 수 없음

### 방식 B: 일반 사용자 로그인 + 조회용 서비스 계정

사용자 로그인 인증과 디렉터리 조회를 분리한다.

```text
일반 사용자 아이디/비밀번호
  ↓
DSM 사용자 인증
  ↓
인증 성공
  ↓
백엔드가 별도의 조회용 DSM 관리자 계정으로 로그인
  ↓
사용자·그룹·구성원 조회
  ↓
웹 애플리케이션 세션 발급
```

서비스 계정 예:

```text
계정명: webapp-directory-service
용도: 사용자 및 그룹 조회
```

> DSM은 세밀한 읽기 전용 사용자 관리 권한을 제공하지 않을 수 있다.  
> 관리자 그룹에 포함된 서비스 계정은 높은 권한을 가지므로 서비스 계정 비밀번호와 웹 백엔드를 강하게 보호해야 한다.

---

## 3. API 안정성 주의사항

`SYNO.API.Auth`는 Synology가 공식 문서로 제공하는 API이다.

그러나 다음 API는 DSM 내부 관리 API 성격이 강하다.

```text
SYNO.Core.User
SYNO.Core.Group
SYNO.Core.Group.Member
```

DSM 모델 또는 DSM 업데이트에 따라 다음 항목이 변경될 수 있다.

- API 존재 여부
- 최대 API 버전
- 요청 파라미터
- 응답 데이터 구조
- 관리자 권한 요구사항

따라서 애플리케이션 시작 시 `SYNO.API.Info`로 API 지원 여부를 확인해야 한다.

---

## 4. 환경변수 설정

`.env` 파일:

```env
NAS_BASE_URL=https://nas.example.com:5001

SESSION_SECRET=충분히_긴_랜덤_문자열
SESSION_HTTPS_ONLY=false

NAS_CA_BUNDLE=

# 일반 사용자도 로그인할 수 있고,
# 전체 사용자 및 그룹을 별도 관리자 계정으로 조회해야 할 때 사용
DSM_DIRECTORY_ACCOUNT=webapp-directory-service
DSM_DIRECTORY_PASSWORD=서비스_계정_비밀번호
```

운영 환경에서는 `.env` 파일 대신 다음을 권장한다.

- Docker Secret
- Windows Credential Manager
- HashiCorp Vault
- 클라우드 Secret Manager
- CI/CD Secret

`.env` 파일은 Git에 커밋하지 않는다.

`.gitignore`:

```gitignore
.env
__pycache__/
*.pyc
```

---

## 5. DSM API 클라이언트 작성

`synology_dsm.py` 파일을 생성한다.

```python
import asyncio
import json
import os
import ssl
from dataclasses import dataclass
from typing import Any

import httpx
from dotenv import load_dotenv


load_dotenv()

NAS_BASE_URL = os.environ["NAS_BASE_URL"].rstrip("/")
NAS_CA_BUNDLE = os.getenv("NAS_CA_BUNDLE", "").strip()


class DSMError(Exception):
    def __init__(
        self,
        message: str,
        code: int | None = None,
        api: str | None = None,
    ):
        super().__init__(message)
        self.code = code
        self.api = api


@dataclass
class DSMSession:
    sid: str
    synotoken: str | None = None


def get_ssl_verify():
    if NAS_CA_BUNDLE:
        return ssl.create_default_context(cafile=NAS_CA_BUNDLE)

    return True


class SynologyDSMClient:
    def __init__(self):
        self.endpoint = f"{NAS_BASE_URL}/webapi/entry.cgi"
        self.client = httpx.AsyncClient(
            verify=get_ssl_verify(),
            timeout=15.0,
        )

    async def close(self):
        await self.client.aclose()

    async def request(
        self,
        api: str,
        version: int,
        method: str,
        session: DSMSession | None = None,
        **params: Any,
    ) -> dict[str, Any]:
        payload: dict[str, Any] = {
            "api": api,
            "version": str(version),
            "method": method,
        }

        payload.update(params)

        if session:
            payload["_sid"] = session.sid

            if session.synotoken:
                payload["SynoToken"] = session.synotoken

        response = await self.client.post(
            self.endpoint,
            data=payload,
        )
        response.raise_for_status()

        result = response.json()

        if result.get("success") is not True:
            error_code = result.get("error", {}).get("code")

            raise DSMError(
                message=(
                    f"DSM API 호출 실패: "
                    f"api={api}, code={error_code}"
                ),
                code=error_code,
                api=api,
            )

        return result.get("data", {})

    async def login(
        self,
        username: str,
        password: str,
        otp_code: str | None = None,
    ) -> DSMSession:
        payload: dict[str, Any] = {
            "api": "SYNO.API.Auth",
            "version": "6",
            "method": "login",
            "account": username,
            "passwd": password,
            "session": "WebApp",
            "format": "sid",
            "enable_syno_token": "yes",
        }

        if otp_code:
            payload["otp_code"] = otp_code

        response = await self.client.post(
            self.endpoint,
            data=payload,
        )
        response.raise_for_status()

        result = response.json()

        if result.get("success") is not True:
            error_code = result.get("error", {}).get("code")

            raise DSMError(
                message="DSM 로그인에 실패했습니다.",
                code=error_code,
                api="SYNO.API.Auth",
            )

        data = result.get("data", {})

        return DSMSession(
            sid=data["sid"],
            synotoken=data.get("synotoken"),
        )

    async def logout(self, session: DSMSession):
        try:
            await self.request(
                api="SYNO.API.Auth",
                version=6,
                method="logout",
                session=session,
            )
        except (DSMError, httpx.HTTPError):
            pass

    async def get_api_info(
        self,
        api_names: list[str],
    ) -> dict[str, Any]:
        data = await self.request(
            api="SYNO.API.Info",
            version=1,
            method="query",
            query=",".join(api_names),
        )

        return data

    async def check_directory_apis(self) -> dict[str, Any]:
        required = [
            "SYNO.API.Auth",
            "SYNO.Core.User",
            "SYNO.Core.Group",
            "SYNO.Core.Group.Member",
        ]

        api_info = await self.get_api_info(required)

        missing = [
            api_name
            for api_name in required
            if api_name not in api_info
        ]

        if missing:
            raise DSMError(
                "DSM에서 필요한 API를 지원하지 않습니다: "
                + ", ".join(missing)
            )

        return api_info

    async def get_users(
        self,
        session: DSMSession,
    ) -> list[dict[str, Any]]:
        data = await self.request(
            api="SYNO.Core.User",
            version=1,
            method="list",
            session=session,
            type="local",
            offset=0,
            limit=-1,
            sort_by="name",
            sort_direction="ASC",
            additional=json.dumps(
                [
                    "description",
                    "email",
                    "expired",
                    "cannot_chg_passwd",
                    "passwd_never_expire",
                    "password_last_change",
                    "groups",
                    "2fa_status",
                ]
            ),
        )

        return data.get("users", [])

    async def get_user(
        self,
        session: DSMSession,
        username: str,
    ) -> dict[str, Any] | None:
        data = await self.request(
            api="SYNO.Core.User",
            version=1,
            method="get",
            session=session,
            type="local",
            name=username,
            additional=json.dumps(
                [
                    "description",
                    "email",
                    "expired",
                    "cannot_chg_passwd",
                    "passwd_never_expire",
                    "password_last_change",
                    "is_password_pending",
                ]
            ),
        )

        users = data.get("users", [])

        if not users:
            return None

        return users[0]

    async def get_groups(
        self,
        session: DSMSession,
    ) -> list[dict[str, Any]]:
        data = await self.request(
            api="SYNO.Core.Group",
            version=1,
            method="list",
            session=session,
            type="local",
            offset=0,
            limit=-1,
            name_only="false",
        )

        return data.get("groups", [])

    async def get_group_members(
        self,
        session: DSMSession,
        group_name: str,
    ) -> list[dict[str, Any]]:
        data = await self.request(
            api="SYNO.Core.Group.Member",
            version=1,
            method="list",
            session=session,
            group=group_name,
            ingroup="true",
        )

        return data.get("users", [])

    async def get_groups_with_members(
        self,
        session: DSMSession,
        concurrency: int = 3,
    ) -> list[dict[str, Any]]:
        groups = await self.get_groups(session)
        semaphore = asyncio.Semaphore(concurrency)

        async def load_members(
            group: dict[str, Any],
        ) -> dict[str, Any]:
            async with semaphore:
                members = await self.get_group_members(
                    session=session,
                    group_name=group["name"],
                )

            return {
                "gid": group.get("gid"),
                "name": group.get("name"),
                "description": group.get("description", ""),
                "members": [
                    {
                        "uid": user.get("uid"),
                        "name": user.get("name"),
                        "description": user.get(
                            "description",
                            "",
                        ),
                    }
                    for user in members
                ],
            }

        return await asyncio.gather(
            *(load_members(group) for group in groups)
        )

    async def get_directory(
        self,
        session: DSMSession,
    ) -> dict[str, Any]:
        users, groups = await asyncio.gather(
            self.get_users(session),
            self.get_groups_with_members(session),
        )

        membership_map: dict[str, list[str]] = {}

        for group in groups:
            group_name = group.get("name")

            for member in group.get("members", []):
                username = member.get("name")

                if username:
                    membership_map.setdefault(
                        username,
                        [],
                    ).append(group_name)

        normalized_users = []

        for user in users:
            username = user.get("name")

            normalized_users.append(
                {
                    "uid": user.get("uid"),
                    "name": username,
                    "description": user.get(
                        "description",
                        "",
                    ),
                    "email": user.get("email", ""),
                    "expired": user.get("expired"),
                    "groups": sorted(
                        membership_map.get(
                            username,
                            [],
                        )
                    ),
                }
            )

        return {
            "users": normalized_users,
            "groups": groups,
        }
```

---

## 6. 디렉터리 전체 조회 테스트

`test_directory.py` 파일을 생성한다.

```python
import asyncio
import json
import os

from dotenv import load_dotenv

from synology_dsm import SynologyDSMClient


load_dotenv()


async def main():
    account = os.environ["DSM_DIRECTORY_ACCOUNT"]
    password = os.environ["DSM_DIRECTORY_PASSWORD"]

    dsm = SynologyDSMClient()

    try:
        api_info = await dsm.check_directory_apis()

        print("지원 API:")
        print(
            json.dumps(
                api_info,
                ensure_ascii=False,
                indent=2,
            )
        )

        session = await dsm.login(
            username=account,
            password=password,
        )

        try:
            directory = await dsm.get_directory(session)

            print("사용자 및 그룹:")
            print(
                json.dumps(
                    directory,
                    ensure_ascii=False,
                    indent=2,
                )
            )
        finally:
            await dsm.logout(session)
    finally:
        await dsm.close()


if __name__ == "__main__":
    asyncio.run(main())
```

실행:

```powershell
conda activate synology-web-login
python test_directory.py
```

---

## 7. 조회 결과 구조

### 사용자 목록

```json
{
  "users": [
    {
      "uid": 1026,
      "name": "user01",
      "description": "홍길동 / 개발팀",
      "email": "user01@example.com",
      "expired": "normal",
      "groups": [
        "developers",
        "users"
      ]
    }
  ]
}
```

### 그룹 목록

```json
{
  "groups": [
    {
      "gid": 65536,
      "name": "developers",
      "description": "개발팀",
      "members": [
        {
          "uid": 1026,
          "name": "user01",
          "description": "홍길동 / 개발팀"
        }
      ]
    }
  ]
}
```

---

## 8. FastAPI 디렉터리 API 추가

기존 `app.py`에 다음 import를 추가한다.

```python
import os

from fastapi.responses import JSONResponse

from synology_dsm import DSMError, SynologyDSMClient
```

디렉터리 API를 추가한다.

```python
@app.get("/api/directory")
async def directory_api(request: Request):
    login_username = request.session.get("username")

    if not login_username:
        return JSONResponse(
            {
                "success": False,
                "message": "로그인이 필요합니다.",
            },
            status_code=401,
        )

    service_account = os.getenv(
        "DSM_DIRECTORY_ACCOUNT",
        "",
    )
    service_password = os.getenv(
        "DSM_DIRECTORY_PASSWORD",
        "",
    )

    if not service_account or not service_password:
        return JSONResponse(
            {
                "success": False,
                "message": (
                    "디렉터리 조회용 DSM 계정이 "
                    "설정되지 않았습니다."
                ),
            },
            status_code=500,
        )

    dsm = SynologyDSMClient()

    try:
        await dsm.check_directory_apis()

        dsm_session = await dsm.login(
            username=service_account,
            password=service_password,
        )

        try:
            directory = await dsm.get_directory(
                dsm_session
            )
        finally:
            await dsm.logout(dsm_session)

        return {
            "success": True,
            "data": directory,
        }

    except DSMError as error:
        return JSONResponse(
            {
                "success": False,
                "message": str(error),
                "dsm_error_code": error.code,
                "dsm_api": error.api,
            },
            status_code=502,
        )

    finally:
        await dsm.close()
```

로그인 후 다음 주소로 조회한다.

```text
GET /api/directory
```

응답:

```json
{
  "success": true,
  "data": {
    "users": [],
    "groups": []
  }
}
```

---

## 9. 특정 그룹의 사용자만 조회

다음 API를 추가할 수 있다.

```python
@app.get("/api/groups/{group_name}/members")
async def group_members_api(
    group_name: str,
    request: Request,
):
    if not request.session.get("username"):
        return JSONResponse(
            {
                "success": False,
                "message": "로그인이 필요합니다.",
            },
            status_code=401,
        )

    account = os.environ["DSM_DIRECTORY_ACCOUNT"]
    password = os.environ["DSM_DIRECTORY_PASSWORD"]

    dsm = SynologyDSMClient()

    try:
        session = await dsm.login(
            username=account,
            password=password,
        )

        try:
            members = await dsm.get_group_members(
                session=session,
                group_name=group_name,
            )
        finally:
            await dsm.logout(session)

        return {
            "success": True,
            "data": {
                "group": group_name,
                "members": members,
            },
        }

    except DSMError as error:
        return JSONResponse(
            {
                "success": False,
                "message": str(error),
                "dsm_error_code": error.code,
            },
            status_code=502,
        )

    finally:
        await dsm.close()
```

호출 예:

```text
GET /api/groups/developers/members
```

---

## 10. 로그인 사용자의 그룹 확인

웹 애플리케이션 접근 권한을 DSM 그룹으로 제어할 수 있다.

예:

```text
webapp-users
webapp-admins
```

로그인한 사용자가 `webapp-users` 또는 `webapp-admins`에 속했는지 확인한다.

```python
def find_user_groups(
    directory: dict,
    username: str,
) -> list[str]:
    for user in directory.get("users", []):
        if user.get("name") == username:
            return user.get("groups", [])

    return []
```

사용 예:

```python
groups = find_user_groups(
    directory=directory,
    username=login_username,
)

allowed_groups = {
    "webapp-users",
    "webapp-admins",
}

if not allowed_groups.intersection(groups):
    return JSONResponse(
        {
            "success": False,
            "message": "웹 애플리케이션 접근 권한이 없습니다.",
        },
        status_code=403,
    )
```

권한 예:

```text
webapp-users
  └─ 일반 페이지 접근

webapp-admins
  └─ 사용자 및 그룹 관리 화면 접근
```

---

## 11. 개인정보 및 보안

사용자 설명과 이메일은 개인정보로 취급해야 한다.

다음 데이터를 일반 사용자에게 그대로 노출하지 않는 것이 좋다.

- 전체 DSM 사용자 목록
- 사용자 이메일
- 관리자 계정 이름
- 시스템 그룹
- 그룹 구성원
- 계정 만료 상태
- 2단계 인증 상태

권장 정책:

```text
일반 사용자:
  자신의 이름, 설명, 그룹만 조회

webapp-admins:
  전체 사용자와 그룹 조회

DSM 관리자:
  전체 디렉터리 관리
```

API 응답에서 제외를 검토할 시스템 사용자 및 그룹:

```text
admin
guest
http
administrators
users
```

단, `users` 그룹은 모든 일반 사용자가 포함될 수 있으므로 업무 로직에 따라 유지할 수 있다.

---

## 12. 캐시 적용 권장

그룹별 구성원을 조회할 때 그룹 수만큼 API 요청이 발생한다.

예:

```text
그룹 20개
  → 그룹 목록 1회
  → 그룹 구성원 20회
  → 사용자 목록 1회
```

총 22회 정도의 DSM API 요청이 발생할 수 있다.

따라서 다음과 같이 캐시하는 것이 좋다.

```text
캐시 TTL: 30초~5분
```

권장 캐시 키:

```text
synology:directory:users
synology:directory:groups
synology:group:{group_name}:members
```

운영 환경에서는 Redis 사용을 권장한다.

DSM 사용자나 그룹이 변경되면 캐시 TTL 이후 자동으로 반영된다.

---

## 13. 최종 구조

```text
사용자
  ↓ DSM 아이디/비밀번호 로그인
FastAPI
  ↓
SYNO.API.Auth
  ↓
로그인 성공
  ↓
조회용 DSM 서비스 계정
  ├─ SYNO.Core.User
  ├─ SYNO.Core.Group
  └─ SYNO.Core.Group.Member
  ↓
사용자·설명·그룹·구성원 데이터 반환
  ↓
웹 애플리케이션 권한 적용
```

---

## 14. 참고 자료

공식 로그인 API:

- Synology DSM Login Web API Guide  
  https://global.download.synology.com/download/Document/Software/DeveloperGuide/Os/DSM/All/enu/DSM_Login_Web_API_Guide_enu.pdf

사용자 및 그룹 API 구현 참고:

- Synology API Python 프로젝트  
  https://github.com/N4S4/synology-api
- API 목록  
  https://n4s4.github.io/synology-api/docs/apis

`SYNO.Core.User`, `SYNO.Core.Group`, `SYNO.Core.Group.Member`는 공식적으로 안정성이 보장된 공개 API가 아닐 수 있으므로 DSM 업데이트 후 반드시 연동 테스트를 진행한다.
