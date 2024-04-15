// pages/testInfo/testInfo.js

wx.cloud.init()

const db = wx.cloud.database();


function sleep(milliseconds) {
 const date = Date.now();
 let currentDate = null;
 do {
    currentDate = Date.now();
 } while (currentDate - date < milliseconds);
}

Page({

  /**
   * 页面的初始数据
   */
  data: {

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    const that = this;
    const _id = options._id;
    console.log(_id);
    db.collection('test_partInfo').doc(_id).get().then(
      res => {
        that.setData({
          testInfo: res.data
        })
      }
    ).catch(
      err => {
        console.log(err);
        wx.showToast({
          title: '网络错误',
          mask: true
        })
      }
    )
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

  },

  cancelReservation: function () {
    const that = this;
    wx.showLoading({
      title: '处理中',
      mask: true
    })
    const id = that.data.testInfo._id;
    wx.cloud.callFunction({
      name: "cancelReservation",
      data: {
        id: id,
        studentID: wx.getStorageSync('studentID')
      }
    }).then(
      res => {
        console.log(res);
        wx.hideLoading()
        wx.showToast({
          title: '取消成功',
          mask: true
        })
        sleep(1000);
        wx.reLaunch({
          url: '../index/index',
        })
      }
    ).catch(
      err => {
        console.log(err)
        wx.hideLoading()
        wx.showToast({
          title: '取消失败',
          mask: true
        })
      }
    )
  }
})