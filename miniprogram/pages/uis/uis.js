Page({
  data: {
    username: '',
    password: '',
    loading: false,
    showMfa: false,
    phone: '',
    sessionToken: '',
    smsCode: '',
    resendCooldown: 0,
  },

  onLoad() {},

  onUnload() {
    if (this._timer) clearInterval(this._timer);
  },

  onUsernameInput(e) {
    this.setData({ username: e.detail.value });
  },

  onPasswordInput(e) {
    this.setData({ password: e.detail.value });
  },

  onSmsCodeInput(e) {
    this.setData({ smsCode: e.detail.value });
  },

  async handleLogin() {
    const { username, password } = this.data;
    if (!username.trim()) {
      wx.showToast({ title: '请输入用户名', icon: 'none' });
      return;
    }
    if (!password) {
      wx.showToast({ title: '请输入密码', icon: 'none' });
      return;
    }

    this.setData({ loading: true });
    try {
      const res = await wx.cloud.callFunction({
        name: 'casLogin',
        data: { action: 'login', username: username.trim(), password },
      });
      const result = res.result;

      if (result.needMfa) {
        this.setData({
          showMfa: true,
          phone: result.phone,
          sessionToken: result.sessionToken,
          loading: false,
        });
        this.startResendCooldown();
      } else if (result.success) {
        this.onLoginSuccess(result);
      } else {
        wx.showToast({ title: result.error || '登录失败', icon: 'none' });
        this.setData({ loading: false });
      }
    } catch (err) {
      console.error(err);
      wx.showToast({ title: '网络错误，请重试', icon: 'none' });
      this.setData({ loading: false });
    }
  },

  async handleVerifySms() {
    const { smsCode, sessionToken } = this.data;
    if (!smsCode || smsCode.length < 4) {
      wx.showToast({ title: '请输入4位验证码', icon: 'none' });
      return;
    }

    this.setData({ loading: true });
    try {
      const res = await wx.cloud.callFunction({
        name: 'casLogin',
        data: { action: 'verifySms', sessionToken, smsCode },
      });
      const result = res.result;

      if (result.success) {
        this.onLoginSuccess(result);
      } else if (result.code === 'wrong_code') {
        wx.showToast({ title: '验证码错误', icon: 'none' });
        this.setData({ loading: false, smsCode: '' });
      } else if (result.code === 'expired') {
        wx.showToast({ title: '验证码已过期，请重新获取', icon: 'none' });
        this.setData({ loading: false, smsCode: '' });
      } else {
        wx.showToast({ title: result.error || '验证失败', icon: 'none' });
        this.setData({ loading: false });
      }
    } catch (err) {
      console.error(err);
      wx.showToast({ title: '网络错误，请重试', icon: 'none' });
      this.setData({ loading: false });
    }
  },

  async handleResendSms() {
    if (this.data.resendCooldown > 0) return;

    this.setData({ loading: true });
    try {
      const res = await wx.cloud.callFunction({
        name: 'casLogin',
        data: { action: 'resendSms', sessionToken: this.data.sessionToken },
      });
      const result = res.result;

      if (result.sessionToken) {
        this.setData({ sessionToken: result.sessionToken });
        this.startResendCooldown();
        wx.showToast({ title: '验证码已重新发送', icon: 'success' });
      } else {
        wx.showToast({ title: result.error || '发送失败', icon: 'none' });
      }
    } catch (err) {
      console.error(err);
      wx.showToast({ title: '网络错误', icon: 'none' });
    }
    this.setData({ loading: false });
  },

  startResendCooldown() {
    this.setData({ resendCooldown: 60 });
    if (this._timer) clearInterval(this._timer);
    this._timer = setInterval(() => {
      if (this.data.resendCooldown <= 1) {
        clearInterval(this._timer);
        this.setData({ resendCooldown: 0 });
      } else {
        this.setData({ resendCooldown: this.data.resendCooldown - 1 });
      }
    }, 1000);
  },

  handleBack() {
    if (this._timer) clearInterval(this._timer);
    this.setData({ showMfa: false, smsCode: '', resendCooldown: 0 });
  },

  onLoginSuccess(result) {
    wx.showLoading({ title: '正在验证..', mask: true });
    const pages = getCurrentPages();
    const prevPage = pages[pages.length - 2];
    if (prevPage && prevPage.nextStep) {
      prevPage.setData({
        studentID: result.username,
        attributes: result.attributes,
      });
      prevPage.nextStep();
    }
  },
});
