// pages/studentLogin/studentLogin.js

wx.cloud.init()

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
    const that = this;
    //console.log(that.data.accountInfo);
    let studentID = wx.getStorageSync('studentID');
    //console.log(studentName)
    if(studentID){
      db.collection('student_reserve').doc(studentID).get().then(
        res => {
          wx.switchTab({
            url: '../personalInfo/personalInfo',
          })
        }
      ).catch(
        err => {
          wx.showToast({
            title: '网络错误',
          })
        }
      )
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

  refreshAccountInfo (x) {
    let i = x.detail.value;
    this.setData (
      {
        accountInfo: i.trim()
      }
    );
  },

  refreshPassword (x) {
    let i = x.detail.value;
    this.setData (
      {
        password: i.trim()
      }
    );
  },

  studentLogin: function () {
    const that = this;
    //console.log(that.data.accountInfo);
    db.collection('student_reserve').doc(that.data.accountInfo).get().then(
      res => {
        if(res.data.password == that.data.password){
          wx.setStorageSync('studentID',that.data.accountInfo);
          wx.setStorageSync('studentPassword',that.data.password);
          wx.setStorageSync('studentName',res.data.name);
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
})