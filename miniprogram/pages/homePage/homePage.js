var app = getApp();
var util = require('../../commonFunction/cloudFunction')
const initFunction = require('../../commonFunction/initFunction')
const normalFunction = require('../../commonFunction/normalFunction')
Page({

  /**
   * 页面的初始数据
   */
  data: {
    reserveExam: [],
    sname:'',
    sign:'',
    nosign:'',
    
    
    barInfo: app.globalData.barInfo,


  },
  //跳转
  navigateToTabbar(e) {
    console.log(e.currentTarget.dataset.url)
    wx.switchTab({
      url: e.currentTarget.dataset.url,
    })
  },

  

  //导航去报名啦
  navigateToExam(e) {
    //调用同步函数
    normalFunction.setStorageSync('cno', e.currentTarget.dataset.cno)
      .then(() => {
        wx.redirectTo({
          url: e.currentTarget.dataset.url
        })
      })
      .catch((error) => {
        console.error('缓存失败：', error)
      })
   
  },

  //初始化函数
  initFunction(){
    
    let student = wx.getStorageSync('student');
    this.data.reserveExam=student.cno;
    this.data.sign=student.test_partInfo_openid.length
    this.data.nosign=student.cno.length-student.test_partInfo_openid.length
    this.setData({
      sname:student.sname,
      reserveExam:this.data.reserveExam,
      sign:this.data.sign,
      nosign:this.data.nosign,
    })

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log(wx.getStorageSync('student'))
    if(wx.getStorageSync('student')){
      this.initFunction()
    }else{
      initFunction.initFunction()
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
    console.log(wx.getStorageSync('student'))
    if(wx.getStorageSync('student')){
      this.initFunction()
    }else{
      initFunction.initFunction()
     
    }
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