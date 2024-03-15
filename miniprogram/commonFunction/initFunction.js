const cloudFunction = require('./cloudFunction')
const app = getApp();

//判断用户登录状态
function getUserLogo(openid) {
  //判断登录问题
  const db = wx.cloud.database();
  var that = this
  db.collection('student_reserve') //拿到表。双引号也行
    .where({
      user_openid: openid
    })
    .get({ //查询操作
      //请求成功  
      success(res) {
        console.log(res.data.length)
        if (res.data.length > 0){
          wx.setStorageSync('logoFlag', true);
          wx.setStorageSync('openid', openid);
          wx.setStorageSync('student', res.data[0]);
          wx.hideLoading();
        } else {
          wx.setStorageSync('logoFlag', false);
          wx.setStorageSync('openid', openid);
          wx.hideLoading();
        }
      },
      //请求失败
      fail(err) {
        console.log('请求失败', err)
        wx.showToast({
          title: '出现故障',
          icon: 'error'
        })
        wx.hideLoading();
      }
    })
}

function initFunction() {
  wx.showLoading({
    title: '加载中',
    mask:true
  })
  let that = this
  if (!wx.cloud) {
    console.error('请使用 2.2.3 或以上的基础库以使用云能力');
  } else {
    wx.cloud.init({
      traceUser: true,
    }).then(res => {
      wx.cloud.callFunction({
        name: 'getOpenid',
        success: res => {
          console.log('云函数调用成功', res.result);
          // 处理返回结果
          app.globalData.openid = res.result.openid;
          that.getUserLogo(res.result.openid)
        },
        fail: err => {
          console.error('云函数调用失败', err);
          // 处理错误信息
        }
      });
    });
  }
  
}



module.exports = {
  initFunction: initFunction,
  getUserLogo: getUserLogo,
}