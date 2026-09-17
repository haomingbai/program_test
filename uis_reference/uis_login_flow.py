#!/usr/bin/env python3
"""
西北工业大学统一身份认证 (UIS) API 完整流程脚本
===============================================
支持流程:
  1. 密码登录 - 成功
  2. 密码登录 - 用户名/密码错误
  3. MFA安全手机验证码 - 发送验证码
  4. MFA安全手机验证码 - 验证码错误
  5. MFA安全手机验证码 - 验证码过期
  6. MFA安全手机验证码 - 验证码正确
  7. 登录成功后获取个人信息 (学号、姓名、本科生/研究生、学院等)

API 端点总结:
  GET  /cas/login                                    - 登录页面, 获取 execution token
  GET  /cas/jwt/publicKey                            - RSA 公钥 (1024-bit)
  POST /cas/mfa/detect                               - 检测是否需要MFA, 获取 mfaState
  GET  /cas/mfa/initByType/{type}?state={state}      - 初始化MFA验证方式
  POST {attestServerUrl}/api/guard/securephone/send   - 发送手机验证码
  POST {attestServerUrl}/api/guard/securephone/valid  - 验证手机验证码
  POST /cas/login (with service)                     - 完成登录, 获取 JWT Service Ticket
"""

import requests
import json
import re
import sys
import base64
from datetime import datetime

try:
    from Crypto.PublicKey import RSA
    from Crypto.Cipher import PKCS1_v1_5
except ImportError:
    print("请安装 pycryptodome: pip install pycryptodome")
    sys.exit(1)

# ============================================================
# 配置
# ============================================================
BASE_URL = "https://uis.nwpu.edu.cn"
SERVICE = "https://ecampus.nwpu.edu.cn/"


def load_credentials():
    """从 key.txt 加载测试账号"""
    creds = {}
    with open("key.txt", "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if "=" in line:
                k, v = line.split("=", 1)
                creds[k.strip()] = v.strip()
    return creds["USERNAME"], creds["PASSWORD"]


def rsa_encrypt(plaintext, public_key_pem):
    """使用 RSA 公钥加密明文, 返回 base64 编码"""
    public_key = RSA.import_key(public_key_pem)
    cipher = PKCS1_v1_5.new(public_key)
    encrypted = cipher.encrypt(plaintext.encode("utf-8"))
    return base64.b64encode(encrypted).decode("utf-8")


def decode_jwt_payload(jwt_str):
    """解码 JWT 的 payload 部分 (不验证签名)"""
    parts = jwt_str.split(".")
    if len(parts) < 2:
        return None
    payload_b64 = parts[1].replace("-", "+").replace("_", "/")
    padding = 4 - len(payload_b64) % 4
    if padding != 4:
        payload_b64 += "=" * padding
    try:
        return json.loads(base64.b64decode(payload_b64).decode("utf-8"))
    except Exception:
        return None


# ============================================================
# 步骤1: 获取公钥
# ============================================================
def step_get_public_key(session):
    """
    GET /cas/jwt/publicKey
    返回: RSA 公钥 (PEM格式, 1024-bit)

    服务器响应示例:
      -----BEGIN PUBLIC KEY-----
      MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDBQw6TmvJ+nOuRaLoHsZJGIBzR
      ...
      -----END PUBLIC KEY-----

    用户名说明: 支持用户名/学号/手机号/邮箱/证件号
    """
    print("=" * 60)
    print("步骤1: 获取RSA公钥")
    resp = session.get(f"{BASE_URL}/cas/jwt/publicKey")
    public_key = resp.text.strip()
    print(f"  [OK] 公钥长度: {len(public_key)} bytes")
    return public_key


# ============================================================
# 步骤2: 检测MFA状态
# ============================================================
def step_mfa_detect(session, username, encrypted_password):
    """
    POST /cas/mfa/detect
    参数: username={用户名}&password={__RSA__密文}
    用途: 检测该账号是否启用了MFA, 并获取 mfaState

    密码正确时的服务器响应:
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
        "state": "l2tpUW"        // 短 state 用于后续MFA初始化
      }
    }

    code=0 表示请求成功 (注意: 此时密码尚未真正验证, 仅检测MFA配置)
    need=true 表示本次登录需要MFA验证
    need=false 表示本次登录不需要MFA验证 (可直接提交登录表单)
    """
    print("=" * 60)
    print("步骤2: 检测MFA状态")
    data = f"username={requests.utils.quote(username)}&password={requests.utils.quote(encrypted_password)}"
    headers = {"Content-Type": "application/x-www-form-urlencoded"}
    resp = session.post(f"{BASE_URL}/cas/mfa/detect", data=data, headers=headers)

    result = resp.json()
    code = result.get("code")
    data_obj = result.get("data", {})
    mfa_enabled = data_obj.get("mfaEnabled", False)
    mfa_need = data_obj.get("need", False)
    state = data_obj.get("state", "")

    print(f"  响应: code={code}")
    print(f"  MFA已启用: {mfa_enabled}")
    print(f"  本次需要MFA: {mfa_need}")
    print(f"  MFA state: {state}")
    print(f"  安全手机: {data_obj.get('mfaTypeSecurePhone', False)}")
    print(f"  安全邮箱: {data_obj.get('mfaTypeSecureEmail', False)}")

    return result


# ============================================================
# 步骤2b: 密码错误场景
# ============================================================
def step_mfa_detect_wrong_password(session, username):
    """
    场景: 密码错误

    使用错误密码调用 /cas/mfa/detect
    注意: 该接口仅检测MFA配置, 不会真正验证密码
    因此即使用错误密码, 也会返回相同的MFA配置信息

    真正的密码验证发生在 POST /cas/login 提交表单时。
    如果密码错误, 服务器返回登录页面并显示错误信息。
    """
    print("=" * 60)
    print("场景: 密码错误测试")
    wrong_pwd = f"__RSA__{rsa_encrypt('wrongpassword', get_public_key_raw(session))}"

    data = f"username={requests.utils.quote(username)}&password={requests.utils.quote(wrong_pwd)}"
    headers = {"Content-Type": "application/x-www-form-urlencoded"}
    resp = session.post(f"{BASE_URL}/cas/mfa/detect", data=data, headers=headers)

    print(f"  响应: {resp.json()}")
    print("  注意: /cas/mfa/detect 仅检测MFA配置, 不验证密码")
    print("  密码验证在 POST /cas/login 时进行")

    return resp.json()


def get_public_key_raw(session):
    """获取原始公钥文本"""
    resp = session.get(f"{BASE_URL}/cas/jwt/publicKey")
    return resp.text.strip()


# ============================================================
# 步骤3: 初始化MFA验证 (安全手机)
# ============================================================
def step_mfa_init_securephone(session, state):
    """
    GET /cas/mfa/initByType/securephone?state={state}

    服务器响应 (code=0 表示成功):
    {
      "code": 0,
      "data": {
        "gid": "2Ayr1Exx_ueXlxZ0D9MB6WZMK",
        "securePhone": "138****5845",
        "attestServerUrl": "https://uis.nwpu.edu.cn/attest"
      }
    }

    gid: 本次MFA会话的全局ID
    securePhone: 脱敏后的安全手机号
    attestServerUrl: 验证服务器地址
    """
    print("=" * 60)
    print("步骤3: 初始化安全手机MFA验证")
    resp = session.get(f"{BASE_URL}/cas/mfa/initByType/securephone", params={"state": state})

    result = resp.json()
    if result.get("code") == 0:
        data = result["data"]
        print(f"  [OK] gid: {data.get('gid')}")
        print(f"  [OK] 安全手机: {data.get('securePhone')}")
        print(f"  [OK] attestServerUrl: {data.get('attestServerUrl')}")
    else:
        print(f"  [FAIL] 响应: {result}")

    return result


# ============================================================
# 步骤4: 发送手机验证码
# ============================================================
def step_send_sms(session, attest_url, gid):
    """
    POST {attestServerUrl}/api/guard/securephone/send
    Body: {"gid": "..."}

    服务器响应 - 发送成功:
    {
      "code": 0,
      "data": {"result": "ok"},
      "message": null
    }

    发送失败 (过期):
    {
      "code": 非0,
      "data": {"result": "expired"},
      "message": "..."
    }

    发送失败 (其他):
    {
      "code": 非0,
      "data": {},
      "message": "发送失败"
    }
    """
    print("=" * 60)
    print("步骤4: 发送手机验证码")
    resp = session.post(
        f"{attest_url}/api/guard/securephone/send",
        json={"gid": gid},
        headers={"Content-Type": "application/json"},
    )

    result = resp.json()
    code = result.get("code")
    data = result.get("data", {})

    if code == 0 and data.get("result") == "ok":
        print(f"  [OK] 验证码发送成功!")
        print(f"  请在手机上查看 4 位验证码")
    else:
        print(f"  [FAIL] 发送失败: {result}")

    return result


# ============================================================
# 步骤5: 验证手机验证码
# ============================================================
def step_verify_sms(session, attest_url, gid, sms_code):
    """
    POST {attestServerUrl}/api/guard/securephone/valid
    Body: {"gid": "...", "code": "XXXXXX"}

    服务器响应 - 验证码正确:
    {
      "code": 0,
      "data": {"result": "ok", "status": 2},
      "message": null
    }

    status 含义:
      0 - 初始化
      1 - 已发送/等待验证
      2 - 验证通过
      3 - 验证失败 (验证码错误)
      5 - 已取消
      9 - 已过期

    验证码错误 (status=3):
    {
      "code": 0,
      "data": {"result": "ok", "status": 3},
      "message": null
    }
    """
    print("=" * 60)
    print(f"步骤5: 验证手机验证码 (输入: {sms_code})")
    resp = session.post(
        f"{attest_url}/api/guard/securephone/valid",
        json={"gid": gid, "code": sms_code},
        headers={"Content-Type": "application/json"},
    )

    result = resp.json()
    status = result.get("data", {}).get("status", -1)

    status_map = {
        0: "初始化",
        1: "已发送/等待验证",
        2: "验证通过",
        3: "验证失败 (验证码错误)",
        5: "已取消",
        9: "已过期",
    }

    print(f"  status={status} -> {status_map.get(status, '未知状态')}")

    if status == 2:
        print(f"  [OK] MFA验证成功!")
    elif status == 3:
        print(f"  [FAIL] 验证码错误, 请重试")
    elif status == 9:
        print(f"  [FAIL] 验证码已过期, 请重新发送")

    return result


# ============================================================
# 步骤6: 提交登录表单
# ============================================================
def step_login_submit(session, username, encrypted_password, execution, state):
    """
    POST /cas/login?service={service}

    表单参数:
      username: 学号
      password: __RSA__加密后的密码
      execution: 登录页面的execution token
      _eventId: submit
      currentMenu: 1
      mfaState: MFA state (如果需要MFA)
      geolocation: ""

    服务器响应:
    - HTTP 302: 登录成功, Location header 包含 JWT Service Ticket
      Location: {service}?redirect=true&ticket={JWT_TOKEN}

    JWT Service Ticket 的 payload 包含用户身份信息:
    {
      "identityTypeCode": "S01",        // 身份类型代码 S01=本科生
      "sub": "2023301350",              // 学号
      "organizationCode": "06410",      // 学院代码
      "idToken": "eyJ...",              // 包含详细用户信息的JWT
      ...
    }

    idToken 解码后包含:
    {
      "ATTR_userNo": "2023301350",          // 学号
      "ATTR_userName": "白昊明",             // 姓名
      "ATTR_name": "白昊明",                 // 姓名
      "ATTR_identityTypeName": "本科生",     // 本科生/研究生
      "ATTR_identityTypeCode": "S01",       // 身份代码
      "ATTR_organizationName": "软件学院",   // 学院名称
      "ATTR_organizationCode": "06410",     // 学院代码
      "ATTR_accountName": "2023301350",     // 账号
      "ATTR_uid": "2023301350",            // 用户ID
      ...
    }

    密码错误时:
    - HTTP 200: 返回登录页面, 显示 "mfaVerifyError"
    """
    print("=" * 60)
    print("步骤6: 提交登录表单")

    form_data = {
        "username": username,
        "password": encrypted_password,
        "execution": execution,
        "_eventId": "submit",
        "geolocation": "",
        "currentMenu": "1",
        "mfaState": state,
    }

    resp = session.post(
        f"{BASE_URL}/cas/login",
        params={"service": SERVICE},
        data=form_data,
        allow_redirects=False,
    )

    print(f"  HTTP状态码: {resp.status_code}")

    if resp.status_code in (301, 302, 303):
        location = resp.headers.get("Location", "")
        print(f"  [OK] 登录成功! 重定向到: {location[:80]}...")

        # 提取 Service Ticket (JWT) - 需要URL解码
        from urllib.parse import unquote

        ticket_match = re.search(r"ticket=([^&]+)", unquote(location))
        if ticket_match:
            ticket = ticket_match.group(1)
            print(f"  [OK] 获取到 Service Ticket (JWT)")
            return {"status": "success", "ticket": ticket, "location": location}
    else:
        # 检查错误
        if "mfaVerifyError" in resp.text:
            print(f"  [FAIL] MFA验证失败或需要MFA验证")
        elif "密码" in resp.text or "password" in resp.text.lower():
            print(f"  [FAIL] 密码错误")
        else:
            print(f"  [UNKNOWN] 登录状态未知")
        return {"status": "failed", "response": resp}

    return {"status": "unknown"}


# ============================================================
# 步骤7: 解析用户个人信息
# ============================================================
def step_extract_user_info(ticket):
    """
    从 JWT Service Ticket 中提取用户个人信息

    返回:
    {
      "学号": "2023301350",
      "姓名": "白昊明",
      "身份": "本科生",
      "身份代码": "S01",
      "学院": "软件学院",
      "学院代码": "06410",
      "账号": "2023301350",
      "用户ID": "717ad34034f911eef5a65dcaa5c729f7",
      "账号ID": "71a89a0034f911eef5a65dcaa5c729f7"
    }
    """
    print("=" * 60)
    print("步骤7: 解析用户个人信息")

    # 解码外层 Service Ticket
    st_payload = decode_jwt_payload(ticket)
    if not st_payload:
        print("  [FAIL] 无法解析 Service Ticket")
        return None

    print(f"\n  Service Ticket 基本信息:")
    print(f"    学号(sub): {st_payload.get('sub')}")
    print(f"    身份类型代码: {st_payload.get('identityTypeCode')}")
    print(f"    学院代码: {st_payload.get('organizationCode')}")

    # 解码内层 idToken
    id_token = st_payload.get("idToken", "")
    if not id_token:
        print("  [FAIL] idToken 不存在")
        return None

    id_payload = decode_jwt_payload(id_token)
    if not id_payload:
        print("  [FAIL] 无法解析 idToken")
        return None

    # 映射字段
    identity_map = {
        "S01": "本科生",
        "S02": "硕士研究生",
        "S03": "博士研究生",
        "T01": "教师",
        "T02": "教职工",
    }

    user_info = {
        "学号": id_payload.get("ATTR_userNo", "N/A"),
        "姓名": id_payload.get("ATTR_userName", id_payload.get("ATTR_name", "N/A")),
        "身份": id_payload.get("ATTR_identityTypeName", "N/A"),
        "身份代码": id_payload.get("ATTR_identityTypeCode", "N/A"),
        "学院": id_payload.get("ATTR_organizationName", "N/A"),
        "学院代码": id_payload.get("ATTR_organizationCode", "N/A"),
        "账号": id_payload.get("ATTR_accountName", "N/A"),
        "用户ID": id_payload.get("ATTR_userId", "N/A"),
        "账号ID": id_payload.get("ATTR_accountId", "N/A"),
    }

    print(f"\n  {'='*40}")
    print(f"  用户个人信息:")
    print(f"  {'='*40}")
    for key, value in user_info.items():
        print(f"    {key}: {value}")
    print(f"  {'='*40}")

    # 打印 idToken 中的所有字段
    print(f"\n  idToken 全部字段:")
    for k, v in sorted(id_payload.items()):
        print(f"    {k}: {v}")

    return user_info


# ============================================================
# 完整流程: 密码登录 + MFA (手动输入验证码)
# ============================================================
def run_full_login_flow():
    """
    完整登录流程:
    1. 获取公钥
    2. 检测MFA状态
    3. 如果不需要MFA -> 直接提交登录
    4. 如果需要MFA -> 初始化MFA -> 发送验证码 -> 用户输入 -> 验证 -> 提交登录
    5. 解析用户信息
    """
    print("\n" + "#" * 60)
    print("# 西北工业大学 UIS 统一身份认证 - 完整登录流程")
    print("#" * 60 + "\n")

    username, password = load_credentials()
    print(f"账号: {username}")
    print(f"密码: {'*' * len(password)}")

    session = requests.Session()
    session.headers.update(
        {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"}
    )

    # 1. 获取公钥
    public_key = step_get_public_key(session)

    # 加密密码
    encrypted_raw = rsa_encrypt(password, public_key)
    encrypted_password = f"__RSA__{encrypted_raw}"

    # 2. 获取登录页面的 execution token (需要带 service 参数)
    from urllib.parse import quote

    print("\n" + "=" * 60)
    print("获取 execution token (with service)")
    resp = session.get(f"{BASE_URL}/cas/login", params={"service": SERVICE})
    execution = re.search(r'name="execution" value="([^"]+)"', resp.text)
    if execution:
        execution = execution.group(1)
        print(f"  [OK] execution: {execution[:60]}...")
    else:
        print("  [FAIL] 无法获取 execution token")
        return

    # 3. 检测 MFA
    mfa_result = step_mfa_detect(session, username, encrypted_password)
    mfa_data = mfa_result.get("data", {})
    mfa_need = mfa_data.get("need", False)
    state = mfa_data.get("state", "")

    # 4. 如果不需要 MFA, 直接提交登录
    if not mfa_need:
        print("\n[INFO] 本次登录不需要MFA, 直接提交...")
        result = step_login_submit(
            session, username, encrypted_password, execution, state
        )
        if result.get("status") == "success":
            user_info = step_extract_user_info(result["ticket"])
            return user_info
        else:
            print("[FAIL] 登录失败")
            return None

    # 5. 需要 MFA: 初始化安全手机
    print("\n[INFO] 本次登录需要MFA验证")

    mfa_init = step_mfa_init_securephone(session, state)
    if mfa_init.get("code") != 0:
        print("[FAIL] MFA初始化失败")
        return None

    gid = mfa_init["data"]["gid"]
    attest_url = mfa_init["data"]["attestServerUrl"]

    # 6. 发送验证码
    send_result = step_send_sms(session, attest_url, gid)
    if send_result.get("code") != 0:
        print("[FAIL] 验证码发送失败")
        return None

    # 7. 用户输入验证码
    print("\n" + "-" * 40)
    sms_code = input("请输入手机收到的4位验证码: ").strip()
    print("-" * 40)

    if not sms_code:
        print("[FAIL] 未输入验证码")
        return None

    # 8. 验证验证码
    verify_result = step_verify_sms(session, attest_url, gid, sms_code)
    status = verify_result.get("data", {}).get("status", -1)

    if status == 3:
        print("\n[FAIL] 验证码错误!")
        return None
    elif status == 9:
        print("\n[FAIL] 验证码已过期!")
        return None
    elif status != 2:
        print(f"\n[FAIL] 验证失败 (status={status})")
        return None

    # 9. 验证通过, 提交登录表单
    result = step_login_submit(
        session, username, encrypted_password, execution, state
    )

    if result.get("status") == "success":
        user_info = step_extract_user_info(result["ticket"])
        return user_info
    else:
        print("[FAIL] 登录失败")
        return None


# ============================================================
# 模拟各失败场景 (文档记录服务器响应)
# ============================================================
def document_failure_scenarios():
    """
    记录各失败场景的服务器响应 (不需要真实短信验证码)

    场景:
    A. 密码错误
    B. 验证码错误
    C. 验证码过期
    """
    print("\n" + "#" * 60)
    print("# 失败场景文档")
    print("#" * 60 + "\n")

    username, password = load_credentials()
    session = requests.Session()
    session.headers.update(
        {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"}
    )

    # 获取公钥和正确的加密密码
    public_key = step_get_public_key(session)
    good_enc = f"__RSA__{rsa_encrypt(password, public_key)}"

    # 获取 execution
    resp = session.get(f"{BASE_URL}/cas/login")
    execution = re.search(r'name="execution" value="([^"]+)"', resp.text).group(1)

    # ---- 场景A: 密码错误 ----
    print("\n" + "=" * 60)
    print("场景A: 密码错误")
    print("=" * 60)

    wrong_enc_raw = rsa_encrypt("wrong_password_123", public_key)
    wrong_enc = f"__RSA__{wrong_enc_raw}"

    # 先用错误密码检测MFA (仍会返回MFA配置)
    mfa_result = step_mfa_detect(session, username, wrong_enc)
    state = mfa_result.get("data", {}).get("state", "")

    # 提交登录表单
    form_data = {
        "username": username,
        "password": wrong_enc,
        "execution": execution,
        "_eventId": "submit",
        "geolocation": "",
        "currentMenu": "1",
        "mfaState": state,
    }
    resp_a = session.post(
        f"{BASE_URL}/cas/login",
        params={"service": SERVICE},
        data=form_data,
        allow_redirects=False,
    )

    print(f"\n  服务器响应:")
    print(f"    HTTP状态码: {resp_a.status_code}")
    print(f"    是否重定向: {'是' if resp_a.status_code in (301,302,303) else '否'}")

    if "mfaVerifyError" in resp_a.text or "error" in resp_a.text.lower():
        # 查找具体错误信息
        error_title = re.findall(r'el-alert__title[^>]*>(.*?)</span>', resp_a.text)
        if error_title:
            print(f"    错误信息: {error_title}")
    print(f"    响应URL: {resp_a.url}")

    # ---- 场景B: MFA验证码错误 ----
    print("\n" + "=" * 60)
    print("场景B: 验证码错误 (status=3)")
    print("=" * 60)

    # 重新获取新session
    session2 = requests.Session()
    session2.headers.update(
        {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"}
    )
    public_key2 = get_public_key_raw(session2)
    good_enc2 = f"__RSA__{rsa_encrypt(password, public_key2)}"

    resp2 = session2.get(f"{BASE_URL}/cas/login")
    execution2 = re.search(r'name="execution" value="([^"]+)"', resp2.text).group(1)

    mfa_result2 = step_mfa_detect(session2, username, good_enc2)
    state2 = mfa_result2.get("data", {}).get("state", "")

    mfa_init2 = step_mfa_init_securephone(session2, state2)
    if mfa_init2.get("code") == 0:
        gid2 = mfa_init2["data"]["gid"]
        attest_url2 = mfa_init2["data"]["attestServerUrl"]

        # 发送验证码
        step_send_sms(session2, attest_url2, gid2)

        # 用错误验证码验证
        print("\n  测试错误验证码 '000000':")
        wrong_code_result = step_verify_sms(session2, attest_url2, gid2, "000000")

        print(f"\n  服务器完整响应:")
        print(f"    {json.dumps(wrong_code_result, ensure_ascii=False, indent=4)}")

    # ---- 场景C: MFA验证码过期 ----
    print("\n" + "=" * 60)
    print("场景C: 验证码过期 (status=9)")
    print("=" * 60)
    print("""
  说明: 验证码有过期时间 (通常是5分钟)。
  当验证码过期后, 调用 /api/guard/securephone/valid 会返回:
  {
    "code": 0,
    "data": {"result": "expired", "status": 9},
    "message": null
  }

  前端处理: 显示"已失效，请重新获取验证码", 并自动重新初始化MFA。
  重新初始化:
    1. 调用 /cas/mfa/initByType/securephone?state={state} 获取新的 gid
    2. 重新调用 /api/guard/securephone/send 发送新验证码
""")

    # ---- 场景D: 用户名不存在 ----
    print("\n" + "=" * 60)
    print("场景D: 用户名不存在")
    print("=" * 60)

    session3 = requests.Session()
    session3.headers.update(
        {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"}
    )
    pk3 = get_public_key_raw(session3)
    fake_enc = f"__RSA__{rsa_encrypt('somepassword', pk3)}"

    resp3 = session3.get(f"{BASE_URL}/cas/login")
    exec3 = re.search(r'name="execution" value="([^"]+)"', resp3.text).group(1)

    # 检测MFA (用户名不存在时也会返回MFA配置)
    mfa_result3 = session3.post(
        f"{BASE_URL}/cas/mfa/detect",
        data=f"username=9999999999&password={requests.utils.quote(fake_enc)}",
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    print(f"  /cas/mfa/detect 响应: {mfa_result3.json()}")

    state3 = mfa_result3.json().get("data", {}).get("state", "")

    # 提交登录
    resp3b = session3.post(
        f"{BASE_URL}/cas/login",
        params={"service": SERVICE},
        data={
            "username": "9999999999",
            "password": fake_enc,
            "execution": exec3,
            "_eventId": "submit",
            "geolocation": "",
            "currentMenu": "1",
            "mfaState": state3,
        },
        allow_redirects=False,
    )
    print(f"\n  登录提交响应:")
    print(f"    HTTP状态码: {resp3b.status_code}")
    if "error" in resp3b.text.lower() or "mfaVerifyError" in resp3b.text:
        print(f"    错误: 用户名不存在或密码错误")
    else:
        print(f"    响应URL: {resp3b.url}")


# ============================================================
# 主入口
# ============================================================
if __name__ == "__main__":
    import os

    # 确保在 uis_reference 目录下运行
    script_dir = os.path.dirname(os.path.abspath(__file__))
    key_file = os.path.join(script_dir, "key.txt")
    if not os.path.exists(key_file):
        print("错误: 找不到 key.txt 文件, 请确保在 uis_reference 目录下运行")
        sys.exit(1)
    os.chdir(script_dir)

    if len(sys.argv) > 1 and sys.argv[1] == "doc":
        # 仅输出各失败场景的文档
        document_failure_scenarios()
    elif len(sys.argv) > 1 and sys.argv[1] == "login":
        # 执行完整登录流程 (MFA需要手动输入验证码)
        run_full_login_flow()
    else:
        # 默认: 执行完整登录流程
        run_full_login_flow()
