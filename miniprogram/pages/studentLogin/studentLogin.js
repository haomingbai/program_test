// pages/studentLogin/studentLogin.js

wx.cloud.init()

function sleep(milliseconds) {
 const date = Date.now();
 let currentDate = null;
 do {
    currentDate = Date.now();
 } while (currentDate - date < milliseconds);
}

const db = wx.cloud.database()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    password: "",
    account:{},
    accountInfo:"",

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    wx.showLoading({
      title: '加载中',
      mask:true
    })
    const that = this;
    //console.log(that.data.accountInfo);
    let studentID = wx.getStorageSync('studentID');
    //console.log(studentName)
    if(studentID){
      db.collection('student_reserve').doc(studentID).get().then(
        res => {
          wx.hideLoading()
          wx.switchTab({
            url: '../personalInfo/personalInfo',
          })
        }
      ).catch(
        err => {
          wx.hideLoading()
          wx.showToast({
            title: '网络错误',
          })
        }
      )
    } else {
      wx.hideLoading()
    }
    wx.showLoading({
      title: '加载中',
      mask: true
    })
    db.collection('content').doc('text').get().then(
      res => {
        this.setData({
          reminder: res.data.studentLoginReminder,
          registerReminder: res.data.studentRegisterReminder
        })
        wx.hideLoading()
      }
    ).catch(
      res => {
        wx.hideLoading()
        wx.showToast({
          title: '网络错误',
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
    //console.log(that.data.accountInfo);
    db.collection('student_reserve').doc(that.data.accountInfo.trim()).get().then(
      res => {
        if(res.data.password.trim() == that.data.password.trim()){
          wx.setStorageSync('studentID',that.data.accountInfo.trim());
          wx.setStorageSync('studentPassword',that.data.password.trim());
          wx.setStorageSync('studentName',res.data.name.trim());
          wx.switchTab({
            url: '../personalInfo/personalInfo',
          })
        }else{
          wx.showToast({
            title: '登陆失败',
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
  },

  enrollInContest() {
    this.setData({
      enroll: true
    })
    console.log(this.data.permitted || this.data.enroll)
  },

  refreshName(e) {
    this.setData({
      name: e.detail.value
    })
  },

  register() {
    wx.showLoading({
      title: '加载中',
    })
    wx.cloud.callFunction({
      name: 'studentRegister',
      data: {
        name: this.data.name,
        studentID: this.data.accountInfo,
        password: this.data.password
      }
    }).then(
      res => {
        wx.hideLoading()
        wx.showToast({
          title: res.result.state,
        })
        sleep(1000);
        wx.reLaunch({
          url: '../index/index',
        })
        //console.log(res)
      }
    ).catch(
      err => {
        wx.hideLoading()
        wx.showToast({
          title: '网络错误',
        })
        console.log(err)
      }
    )
  }
})