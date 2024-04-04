var app = getApp();

wx.cloud.init()

const db = wx.cloud.database();

//const initFunction = require('../../commonFunction/initFunction')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    barInfo: app.globalData.barInfo,
    
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
  const  that = this;
    that.setData({
      studentID: wx.getStorageSync('studentID'),
      studentName: wx.getStorageSync('studentName')
    })
    db.collection('student_reserve').doc(that.data.studentID).get().then(
      res => {
        that.setData({
          testInfo: res.data.roomID
        })
      }
    )
    
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    
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
    })
  },

})