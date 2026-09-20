// pages/showPage/showPage.js
//const db = wx.cloud.database()
var app = getApp();

wx.cloud.init()

const db = wx.cloud.database();

Page({

  /**
   * 页面的初始数据
   */
  data: {
    // 所有入口开关默认 false，云函数调用失败时保证不显示任何入口
    admin: false,
    enroll: false,
    signin: false,
    teacher: false,
  },
  toNavigate() {
    /*wx.switchTab({
      //url: '../personalInfo/personalInfo',
    })*/
    wx.navigateTo({
      url: '../studentLogin/studentLogin',
    })
  },

  adminLogin() {
    wx.navigateTo({
      url: '../adminLogin/adminLogin',
    })
  },

  teacherLogin () {
    wx.navigateTo({
      url: '../teacherLogin/teacherLogin',
    })
  },

  studentSignin (){
    wx.navigateTo({
      url: '../studentSignin/studentSignin',
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    wx.showLoading({
      title: '加载中',
      mask: true
    })
    db.collection('content').doc('index').get().then(
      res => {
        this.setData({
          organizationName: res.data.organizationName,
          organizationShortName: res.data.organizationShortName,
          testName: res.data.testName
        })
        wx.hideLoading()
      }
    ).catch(
      err => {
        wx.hideLoading()
        wx.showToast({
          title: '网络错误',
        })
        console.log(err);
      }
    );
    db.collection('content').doc('showIndexButton').get().then(
      res => {
        console.log(res.data);
        this.setData({
          admin: res.data.admin,
          enroll: res.data.enroll,
          signin: res.data.signin,
          teacher: res.data.teacher
        });
      }
    ).catch(
      err => {
        // 云函数/数据库调用失败：正常加载页面，但关闭所有入口开关
        console.log('showIndexButton 调用失败，所有入口已隐藏：', err);
        wx.showToast({
          title: '网络错误',
        })
        this.setData({
          admin: false,
          enroll: false,
          signin: false,
          teacher: false
        });
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

  }
})