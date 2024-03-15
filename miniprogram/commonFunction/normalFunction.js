//合法性判断,这个地方先长读即可

//弹窗设置
function showToast(text,icon){
  wx.showToast({
    title: text,
    icon:icon,
  })
}

//跳转界面-tabbar
function switchTab(url){
  wx.switchTab({
    url: url,
  });
}

//跳转界面-正常界面
function navigateTo(url){
  wx.redirectTo({
    url: url,
  })
}

//缓存同步问题
// 使用 Promise 封装异步的缓存方法
function setStorageSync(key, value) {
  return new Promise((resolve, reject) => {
    wx.setStorage({
      key: key,
      data: value,
      success: resolve,
      fail: reject
    })
  })
}

//同步取缓存的函数
// 使用 Promise 封装异步的缓存方法
function getStorageData(key) {
  return new Promise((resolve, reject) => {
    try {
      const data = wx.getStorageSync(key);
      resolve(data);
    } catch (error) {
      reject(error);
    }
  });
}

function randomChoiceFromString(string) {
  var choices = string.split(',');
  var index = Math.floor(Math.random() * choices.length);
  return choices[index];
}

module.exports = {
  //legalGudgment:legalGudgment,
  showToast:showToast,
  navigateTo:navigateTo,
  switchTab:switchTab,
  setStorageSync:setStorageSync,
  getStorageData:getStorageData,
  randomChoiceFromString:randomChoiceFromString
}
