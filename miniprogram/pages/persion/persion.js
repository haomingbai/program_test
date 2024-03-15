// pages/persion/persion.js
const cloudFunction = require('../../commonFunction/cloudFunction')
const initFunction = require('../../commonFunction/initFunction')
Page({

  /**
   * 页面的初始数据
   */
  data: {
    name: '',
  },
  //系统管理
  backStage() {
    wx.showToast({
      title: '功能暂未开放',
      icon: 'error'
    })
  },
  //导航到注册界面
  toInfo() {
    wx.navigateTo({
      url: '/pages/logo/logo',
    })
  },

  // 导航
  navigateToTabbar(e) {
    wx.switchTab({
      url: e.currentTarget.dataset.url,
    })
    console.log(e.currentTarget.dataset.url)
  },
  //导航其他界面
  url(e) {
    console.log(e.currentTarget.dataset.url)
    wx.navigateTo({
      url: e.currentTarget.dataset.url,
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  initFunction() {
    let that = this
    let openid = wx.getStorageSync('openid');
    let logoFlag = wx.getStorageSync('logoFlag');
    if (openid && logoFlag) {
      //提取用户数据了
      //缓存区里面有需要的学生信息了
      cloudFunction.getDatabase_user('student_reserve', openid).then(res => {
        let name = res.data[0].sname;
        that.setData({
          name: name
        });
      });
    }
  },

  onLoad(options) {
    initFunction.initFunction()
    this.initFunction()
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    initFunction.initFunction()
    this.initFunction()
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})