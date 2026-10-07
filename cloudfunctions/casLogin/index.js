const axios = require('axios');
const crypto = require('crypto');

const BASE_URL = 'https://uis.nwpu.edu.cn';
const SERVICE = 'https://ecampus.nwpu.edu.cn/';
// HMAC 签名密钥: 在云开发控制台的环境变量 CAS_LOGIN_SECRET 中配置
// 轮换密钥会使存量 MFA 会话 token 失效, 用户需重新登录
const SECRET = process.env.CAS_LOGIN_SECRET;

function rsaEncrypt(plaintext, publicKeyPem) {
  const encrypted = crypto.publicEncrypt(
    {
      key: publicKeyPem,
      padding: crypto.constants.RSA_PKCS1_PADDING,
    },
    Buffer.from(plaintext, 'utf-8')
  );
  return '__RSA__' + encrypted.toString('base64');
}

function decodeJwtPayload(jwtStr) {
  const parts = jwtStr.split('.');
  if (parts.length < 2) return null;
  let payloadB64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
  const padding = 4 - (payloadB64.length % 4);
  if (padding !== 4) payloadB64 += '='.repeat(padding);
  try {
    return JSON.parse(Buffer.from(payloadB64, 'base64').toString('utf-8'));
  } catch (e) {
    return null;
  }
}

function createToken(data) {
  const json = JSON.stringify(data);
  const hmac = crypto.createHmac('sha256', SECRET).update(json).digest('base64');
  return Buffer.from(json).toString('base64') + '.' + hmac;
}

function parseToken(token) {
  const idx = token.lastIndexOf('.');
  const dataB64 = token.substring(0, idx);
  const hmac = token.substring(idx + 1);
  const json = Buffer.from(dataB64, 'base64').toString('utf-8');
  const expectedHmac = crypto.createHmac('sha256', SECRET).update(json).digest('base64');
  if (hmac !== expectedHmac) throw new Error('Invalid token');
  return JSON.parse(json);
}

class CookieJar {
  constructor() {
    this.cookies = {};
  }
  setFromHeaders(headers) {
    const setCookie = headers['set-cookie'];
    if (setCookie) {
      const cookies = Array.isArray(setCookie) ? setCookie : [setCookie];
      for (const c of cookies) {
        const semiIdx = c.indexOf(';');
        const nv = semiIdx >= 0 ? c.substring(0, semiIdx) : c;
        const eqIdx = nv.indexOf('=');
        if (eqIdx >= 0) {
          this.cookies[nv.substring(0, eqIdx).trim()] = nv.substring(eqIdx + 1).trim();
        }
      }
    }
  }
  getHeader() {
    return Object.entries(this.cookies)
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');
  }
}

async function request(config, jar) {
  const headers = { ...config.headers };
  if (jar) {
    const cookie = jar.getHeader();
    if (cookie) headers['Cookie'] = cookie;
  }
  const resp = await axios({
    ...config,
    headers,
    maxRedirects: 0,
    validateStatus: () => true,
  });
  if (jar) jar.setFromHeaders(resp.headers);
  return resp;
}

function extractUserInfo(ticket) {
  const stPayload = decodeJwtPayload(ticket);
  if (!stPayload) return null;
  const idToken = stPayload.idToken;
  if (!idToken) return null;
  const idPayload = decodeJwtPayload(idToken);
  if (!idPayload) return null;
  return {
    username: idPayload.ATTR_userNo || stPayload.sub,
    attributes: {
      organizationname: [idPayload.ATTR_organizationName || ''],
      identitytypename: [idPayload.ATTR_identityTypeName || ''],
      name: [idPayload.ATTR_userName || idPayload.ATTR_name || ''],
    },
  };
}

async function doLogin(username, password, jar, execution, mfaState) {
  const formData = [
    `username=${encodeURIComponent(username)}`,
    `password=${encodeURIComponent(password)}`,
    `execution=${encodeURIComponent(execution)}`,
    '_eventId=submit',
    'currentMenu=1',
    `mfaState=${encodeURIComponent(mfaState)}`,
    'geolocation=',
  ].join('&');

  const resp = await request({
    method: 'POST',
    url: `${BASE_URL}/cas/login`,
    params: { service: SERVICE },
    data: formData,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  }, jar);

  if ([301, 302, 303].includes(resp.status)) {
    const location = resp.headers['location'] || '';
    const ticketMatch = decodeURIComponent(location).match(/ticket=([^&]+)/);
    if (ticketMatch) {
      return { success: true, ...extractUserInfo(ticketMatch[1]) };
    }
  }

  if (resp.data && typeof resp.data === 'string' && resp.data.includes('mfaVerifyError')) {
    return { success: false, error: '密码错误或账号不存在' };
  }

  return { success: false, error: '登录失败，请重试' };
}

exports.main = async (event) => {
  const { action, username, password, sessionToken, smsCode } = event;

  try {
    if (action === 'login') {
      return await handleLoginAction(username, password);
    } else if (action === 'verifySms') {
      return await handleVerifySms(sessionToken, smsCode);
    } else if (action === 'resendSms') {
      return await handleResendSms(sessionToken);
    }
    return { success: false, error: '未知操作' };
  } catch (err) {
    console.error('casLogin error:', err);
    return { success: false, error: err.message || '服务器内部错误' };
  }
};

async function handleLoginAction(username, password) {
  if (!username || !password) {
    return { success: false, error: '请输入用户名和密码' };
  }

  const jar = new CookieJar();

  const loginPageResp = await request({
    method: 'GET',
    url: `${BASE_URL}/cas/login`,
    params: { service: SERVICE },
  }, jar);

  const execMatch = loginPageResp.data.match(/name="execution" value="([^"]+)"/);
  if (!execMatch) {
    return { success: false, error: '无法获取登录令牌，请重试' };
  }
  const execution = execMatch[1];

  const pubKeyResp = await request({
    method: 'GET',
    url: `${BASE_URL}/cas/jwt/publicKey`,
  }, jar);
  const publicKey = pubKeyResp.data.trim ? pubKeyResp.data.trim() : pubKeyResp.data;

  const encryptedPassword = rsaEncrypt(password, publicKey);

  const mfaResp = await request({
    method: 'POST',
    url: `${BASE_URL}/cas/mfa/detect`,
    data: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(encryptedPassword)}`,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  }, jar);

  const mfaResult = mfaResp.data;
  const mfaData = (mfaResult && mfaResult.data) || {};
  const mfaNeed = mfaData.need;
  const mfaState = mfaData.state || '';

  if (!mfaNeed) {
    return await doLogin(username, encryptedPassword, jar, execution, mfaState);
  }

  const initResp = await request({
    method: 'GET',
    url: `${BASE_URL}/cas/mfa/initByType/securephone`,
    params: { state: mfaState },
  }, jar);

  if (initResp.data.code !== 0) {
    return { success: false, error: 'MFA 初始化失败' };
  }

  const { gid, securePhone, attestServerUrl } = initResp.data.data;

  const sendResp = await request({
    method: 'POST',
    url: `${attestServerUrl}/api/guard/securephone/send`,
    data: { gid },
    headers: { 'Content-Type': 'application/json' },
  }, jar);

  if (sendResp.data.code !== 0) {
    return { success: false, error: '验证码发送失败，请重试' };
  }

  const token = createToken({
    username,
    encryptedPassword,
    execution,
    mfaState,
    gid,
    attestUrl: attestServerUrl,
    phone: securePhone,
    cookies: jar.cookies,
  });

  return {
    needMfa: true,
    sessionToken: token,
    phone: securePhone,
  };
}

async function handleVerifySms(sessionToken, smsCode) {
  if (!sessionToken || !smsCode) {
    return { success: false, error: '参数不完整' };
  }

  let session;
  try {
    session = parseToken(sessionToken);
  } catch (e) {
    return { success: false, error: '会话已过期，请重新登录' };
  }

  const jar = new CookieJar();
  jar.cookies = { ...(session.cookies || {}) };

  const validResp = await request({
    method: 'POST',
    url: `${session.attestUrl}/api/guard/securephone/valid`,
    data: { gid: session.gid, code: smsCode },
    headers: { 'Content-Type': 'application/json' },
  }, jar);

  const status = validResp.data && validResp.data.data && validResp.data.data.status;

  if (status === 3) return { success: false, error: '验证码错误', code: 'wrong_code' };
  if (status === 9) return { success: false, error: '验证码已过期，请重新获取', code: 'expired' };
  if (status !== 2) return { success: false, error: '验证失败，请重试' };

  return await doLogin(
    session.username,
    session.encryptedPassword,
    jar,
    session.execution,
    session.mfaState
  );
}

async function handleResendSms(sessionToken) {
  if (!sessionToken) {
    return { success: false, error: '参数不完整' };
  }

  let session;
  try {
    session = parseToken(sessionToken);
  } catch (e) {
    return { success: false, error: '会话已过期，请重新登录' };
  }

  const jar = new CookieJar();
  jar.cookies = { ...(session.cookies || {}) };

  const initResp = await request({
    method: 'GET',
    url: `${BASE_URL}/cas/mfa/initByType/securephone`,
    params: { state: session.mfaState },
  }, jar);

  if (initResp.data.code !== 0) {
    return { success: false, error: 'MFA 初始化失败' };
  }

  const { gid, attestServerUrl } = initResp.data.data;

  const sendResp = await request({
    method: 'POST',
    url: `${attestServerUrl}/api/guard/securephone/send`,
    data: { gid },
    headers: { 'Content-Type': 'application/json' },
  }, jar);

  if (sendResp.data.code !== 0) {
    return { success: false, error: '验证码发送失败' };
  }

  const token = createToken({
    username: session.username,
    encryptedPassword: session.encryptedPassword,
    execution: session.execution,
    mfaState: session.mfaState,
    gid,
    attestUrl: attestServerUrl,
    phone: session.phone,
    cookies: jar.cookies,
  });

  return {
    sessionToken: token,
    phone: session.phone,
  };
}
