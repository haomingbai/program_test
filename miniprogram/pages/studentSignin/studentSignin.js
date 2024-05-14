// pages/studentSignin/studentSignin.js

wx.cloud.init();

const db = wx.cloud.database();

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
    let that = this;
    let studentID = wx.getStorageSync('studentID');
    if(!studentID) {
      that.setData({
        logined: false
      })
      wx.showToast({
        title: '请先登录',
      })
    } else {
      that.setData({
        logined: true,
        studentID: studentID
      })
    }
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
  signin() {
    let that = this
    wx.scanCode().then(
      res => {
        wx.showLoading({
          title: '操作中',
          mask: true
        })
        let studentID = that.data.studentID;
        let roomID = res.result
        wx.cloud.callFunction({
          name: 'studentSignIn',
          data: {
            studentID: studentID,
            roomID: roomID
          }
        }).then(
          r => {
            console.log(r)
            wx.hideLoading()
            wx.reLaunch({
              url: '../index/index',
            })
            setTimeout(function() {wx.showToast({
              title: '签到成功',
            })},1000)
          }
        ).catch(
          e => {
            wx.hideLoading()
            setTimeout(function() {wx.showToast({
              title: '签到失败',
            })},1000)
          }
        )
      }
    ).catch(
      err => {
        console.log(err)
      }
    )
  },

  refreshAccountInfo (x) {
    let i = x.detail.value;
    this.setData (
      {
        accountInfo: i
      }
    );
  },

  refreshPassword (x) {
    let i = x.detail.value;
    this.setData (
      {
        password: i
      }
    );
  },

  studentLogin: function () {
    const that = this;
    console.log(that.data.accountInfo);
    db.collection('student_reserve').where({
      _id: that.data.accountInfo.trim()
    }).get().then(
      res => {
        console.log(res);
        if(res.data.length) {
          if(res.data[0].password.trim() == that.data.password.trim()){
            wx.setStorageSync('studentID',that.data.accountInfo.trim());
            wx.setStorageSync('studentPassword',that.data.password.trim());
            wx.setStorageSync('studentName',res.data[0].name.trim());
            that.setData({
              logined: true
            })
          }else{
            wx.showToast({
              title: '密码错误',
            })
          }
        } else {
          wx.showToast({
            title: '无账户',
          })
        }
      }
    ).catch(
      res => {
        wx.showToast({
          title: '网络错误',
        })
        console.log(res)
      }
    )
  }
})