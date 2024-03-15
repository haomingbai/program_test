// app.js
App({
  globalData: {
    day: [],
    group: '考试报名',
    flag: false,
    room: '',
    room2091Limmit: [],
    room2093Limmit: [],
    room3091Limmit: [],
    room3093Limmit: [],
  },

  getTopBarInfo() {
    // 获取基础设备信息
    let menuInfo = wx.getMenuButtonBoundingClientRect()
    let sysInfo = wx.getSystemInfoSync()

    // 有关头部导航栏
    let barTop = menuInfo.top
    let barBtnH = menuInfo.height
    let statusH = sysInfo.statusBarHeight
    let barH = statusH + barBtnH + (barTop - statusH) * 2
    let margin = sysInfo.screenWidth - menuInfo.right
    if (sysInfo.safeArea) {
      margin = sysInfo.safeArea.width - menuInfo.right
    }
    this.globalData.barInfo = {
      barTop,
      barBtnH,
      barH,
      margin,
    }
  },
  //判断用户登录状态
  getUserLogo(openid) {
    
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
          console.log(res)
          if(res.data.length){
            that.globalData.logoFlag=true
              wx.switchTab({
                url: '../persion/persion',
              }).then(res=>{
                wx.setStorageSync('logoFlag',true);
                wx.setStorageSync('openid',openid);
                wx.hideLoading();
              })
          }else{
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
  },

  //获取用户openid
  getOpenid() {
    wx.showLoading({
      title: '加载中',
      mask:true
    })
    let that = this
    wx.cloud.callFunction({
      name: 'getOpenid',
      success: res => {
        console.log('云函数调用成功', res.result);
        // 处理返回结果
        var openid = res.result.openid;
        that.globalData.openid = openid;
        that.getUserLogo(res.result.openid)
      },
      fail: err => {
        console.error('云函数调用失败', err);
        // 处理错误信息
      }
    });
  },

  initFunction() {
    this.globalData.logoFlag=false
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        traceUser: true,
      }).then(res => {
        this.getOpenid()
      });

    }
  },


  onLaunch: function () {

    this.getTopBarInfo()
    this.initFunction()
  }
});