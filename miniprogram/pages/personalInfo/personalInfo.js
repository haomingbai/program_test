// pages/persion/persion.js

//const initFunction = require('../../commonFunction/initFunction')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    avatar: "../../res/ACM.png"
    
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    this.setData({
      name: wx.getStorageSync('studentName'),
      studentID: wx.getStorageSync('studentID')
    })
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    
  },

  navigateToTabbar (event) {
    console.log(event);
    wx.switchTab({
      url: event.currentTarget.dataset.url,
    }).then(
      e => {
        var page = getCurrentPages().pop();
        if (page == undefined || page == null) return;
        page.onLoad();
      }
    )
  },

  logout () {
    wx.clearStorageSync();
    wx.reLaunch({
      url: '../index/index',
    })
  },

  url(event) {
    wx.navigateTo({
      url: event.currentTarget.dataset.url,
    })
  }

})