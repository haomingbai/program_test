# 西北工业大学 UIS 统一身份认证 API 参考文档

## 概述

- **Base URL**: `https://uis.nwpu.edu.cn`
- **认证方式**: CAS + JWT
- **用户名**: 支持用户名/学号/手机号/邮箱/证件号
- **密码加密**: RSA-1024 (PKCS1_v1_5), Base64编码, 加 `__RSA__` 前缀
- **MFA方式**: 安全手机短信验证码 (4位数字) / 安全邮箱

---

## API 端点清单

| 方法 | 路径 | 用途 |
|------|------|------|
| GET | `/cas/login` | 登录页面，获取 execution token |
| GET | `/cas/jwt/publicKey` | RSA 公钥 |
| POST | `/cas/mfa/detect` | 检测MFA配置，获取 state |
| GET | `/cas/mfa/initByType/{type}` | 初始化MFA验证 (type: securephone/secureemail) |
| POST | `{attestUrl}/api/guard/securephone/send` | 发送手机验证码 |
| POST | `{attestUrl}/api/guard/securephone/valid` | 验证手机验证码 |
| POST | `/cas/login` | 提交登录表单 |
| POST | `/cas/v1/tickets` | CAS REST API (备用) |

---

## 详细 API 说明

### 1. GET /cas/login

获取登录页面和 execution token。

**响应**: HTML 页面，包含:
- `name="execution"` - 登录流程token (每次请求不同)
- `name="currentMenu"` - 登录方式 (1=密码, 2=动态码, 3=二维码)

---

### 2. GET /cas/jwt/publicKey

获取 RSA 公钥。

**响应**: PEM 格式公钥
```
-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDBQw6TmvJ+nOuRaLoHsZJGIBzR...
-----END PUBLIC KEY-----
```

---

### 3. POST /cas/mfa/detect

检测账号的 MFA 配置。

**请求**: `Content-Type: application/x-www-form-urlencoded`
```
username=2023301350&password=__RSA__xxxxx
```

**响应 (成功, code=0)**:
```json
{
  "code": 0,
  "data": {
    "mfaEnabled": true,
    "mfaTypeSecurePhone": true,
    "mfaTypeSecureEmail": true,
    "mfaTypeAppPush": false,
    "mfaTypeQrCode": false,
    "mfaTypeFaceVerify": false,
    "need": false,
    "state": "l2tpUW"
  }
}
```

**重要**: 此接口**不验证密码正确性**，仅检测MFA配置。
无论密码对错，只要账号存在就返回相同的MFA配置结构。

---

### 4. GET /cas/mfa/initByType/{type}

初始化 MFA 验证方式。

**参数**: `?state={from_mfa_detect}`

**type 选项**:
- `securephone` - 安全手机
- `secureemail` - 安全邮箱

**响应 (securephone 成功)**:
```json
{
  "code": 0,
  "data": {
    "gid": "2Ayr1Exx_ueXlxZ0D9MB6WZMK",
    "securePhone": "138****5845",
    "attestServerUrl": "https://uis.nwpu.edu.cn/attest"
  }
}
```

**state 为空时 (500 错误)**:
```json
{
  "timestamp": 1779030453346,
  "status": 500,
  "error": "Internal Server Error",
  "exception": "java.lang.NullPointerException",
  "path": "/cas/mfa/initByType/securephone"
}
```

---

### 5. POST {attestUrl}/api/guard/securephone/send

发送手机短信验证码。

**请求**: `Content-Type: application/json`
```json
{"gid": "2Ayr1Exx_ueXlxZ0D9MB6WZMK"}
```

**响应 (发送成功)**:
```json
{"code": 0, "data": {"result": "ok"}, "message": null}
```

---

### 6. POST {attestUrl}/api/guard/securephone/valid

验证短信验证码。

**请求**: `Content-Type: application/json`
```json
{"gid": "2Ayr1Exx_ueXlxZ0D9MB6WZMK", "code": "3424"}
```

验证码为 **4位数字**。每发送一次新短信生成新验证码，旧码失效。

**status 含义表**:

| status | 含义 | 前端显示 |
|--------|------|---------|
| 0 | 初始化 | 无提示 |
| 1 | 已发送/等待验证 | "等待确认" |
| 2 | 验证通过 | "已确认", 自动提交登录 |
| 3 | 验证失败 | "验证失败" |
| 5 | 已取消 | "已取消" |
| 9 | 已过期 | "已失效，请重新获取验证码" |

**响应 (验证码正确, status=2)**:
```json
{"code": 0, "data": {"result": "ok", "status": 2}, "message": null}
```

**响应 (验证码错误, status=3)**:
```json
{"code": 0, "data": {"result": "ok", "status": 3}, "message": null}
```

**响应 (MFA 会话 gid 过期, ~5分钟TTL)**:
```json
{"code": -1, "data": {}, "message": null}
```
注意: gid 过期后 code=-1, 与验证码过期 (status=9) 不同。实测 gid 和验证码有联合 TTL，过期后需重新从 `/cas/mfa/initByType` 获取新 gid 并重新发送验证码。

**响应 (验证码错误, status=3)**:
```json
{"code": 0, "data": {"result": "ok", "status": 3}, "message": null}
```

---

### 7. POST /cas/login?service={service}

提交最终登录表单。

**请求**: `Content-Type: application/x-www-form-urlencoded`
```
username=2023301350
password=__RSA__xxxxx
execution=xxxxx
_eventId=submit
currentMenu=1
mfaState=l2tpUW
geolocation=
```

#### 场景A: 登录成功 (密码正确 + MFA通过)

**HTTP 302**
```
Location: https://ecampus.nwpu.edu.cn/?redirect=true&ticket=eyJhbGci...
```

Service Ticket (JWT) 的 **外层 payload**:
```json
{
  "identityTypeCode": "S01",
  "aud": "https://ecampus.nwpu.edu.cn/",
  "sub": "2023301350",
  "organizationCode": "06410",
  "iss": "https://uis.nwpu.edu.cn/cas",
  "idToken": "eyJhbGci...",
  "lang": "en",
  "exp": 1779088698,
  "iat": 1779031098,
  "jti": "ST-556053-..."
}
```

idToken 解码后 (**用户完整信息**):
```json
{
  "ATTR_userNo": "2023301350",
  "ATTR_userName": "白昊明",
  "ATTR_name": "白昊明",
  "ATTR_identityTypeName": "本科生",
  "ATTR_identityTypeCode": "S01",
  "ATTR_organizationName": "软件学院",
  "ATTR_organizationCode": "06410",
  "ATTR_accountName": "2023301350",
  "ATTR_uid": "2023301350",
  "ATTR_userId": "717ad340...",
  "ATTR_accountId": "71a89a00...",
  "sub": "2023301350",
  "iss": "uis.nwpu.edu.cn"
}
```

**身份类型代码**:
| Code | 含义 |
|------|------|
| S01 | 本科生 |
| S02 | 硕士研究生 |
| S03 | 博士研究生 |
| T01 | 教师 |
| T02 | 教职工 |

#### 场景B: 密码错误

**HTTP 200** - 返回登录页面

服务器返回的登录页面中会显示错误提示:
- 前端 `localStorage.errorTimes` 记录错误次数
- 5次错误后锁定账号: "账号已暂时锁定，请稍后再试"
- 锁定时间: 5分钟 (300秒)

页面中包含:
```html
<div id="loginError1" style="display: none;">
  <el-alert title="mfaVerifyError" type="error" :closable="false">
  </el-alert>
</div>
```

#### 场景C: 用户名不存在

**HTTP 200** - 返回登录页面

与密码错误响应相同，用户名和密码错误统一处理，不区分具体原因。

#### 场景D: CAS REST API 密码错误

```
POST /cas/v1/tickets
```

**HTTP 401**
```json
{
  "@class": "java.util.HashMap",
  "authentication_exceptions": [
    "java.util.ArrayList",
    ["FailedLoginException: Password does not match value on record."]
  ]
}
```

---

## 完整登录流程

```
1. GET  /cas/login                    → 获取 execution token
2. GET  /cas/jwt/publicKey            → 获取 RSA 公钥
3. 客户端: RSA加密密码, 加 __RSA__ 前缀
4. POST /cas/mfa/detect               → 获取 mfaState, 检查 need
5. if need == true:
   a. GET  /cas/mfa/initByType/securephone?state={state}  → 获取 gid, attestUrl
   b. POST {attestUrl}/api/guard/securephone/send           → 发送验证码
   c. POST {attestUrl}/api/guard/securephone/valid          → 验证验证码
   d. if status == 3: 验证码错误, 提示用户重新输入
   e. if status == 9: 验证码过期, 回到步骤 a 重新初始化
6. POST /cas/login?service={service}  → 302 重定向, 携带 JWT ticket
7. 解码 JWT ticket                    → 提取用户个人信息
```

---

## 安全手机验证码场景处理

| 场景 | HTTP状态 | code | status | 处理方式 |
|------|---------|------|--------|---------|
| 发送成功 | 200 | 0 | - | 等待用户输入验证码 |
| 发送失败 | 200 | 非0 | - | 提示"发送失败" |
| 发送过期 | 200 | 非0 | expired | 提示"已过期，请重新获取" |
| 验证成功 | 200 | 0 | 2 | 自动提交登录 |
| 验证码错误 | 200 | 0 | 3 | 提示"验证失败" |
| 验证码过期 | 200 | 0 | 9 | 提示"已失效，请重新获取验证码" |
| 已取消 | 200 | 0 | 5 | 提示"已取消" |
