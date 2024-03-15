const app = getApp()
const normalFunction = require('../../commonFunction/normalFunction')
Page({

  /**
   * 页面的初始数据
   */
  data: {
    //随机的数据范围
    randPlace:'107,209-1,209-3,309-1,309-3,407-1,407-3',
    place:'',
    time:'',
    cno:'',
    
    organization_id: '',
    _id: '',
    work: '',
    onduty: {},
    name: '',
    phone: '',
    Identify: '',
    motto: 'Hello World',
    qrcodeURL: "",
    codeText: "",
    memberList: [{
      name: '',
      Identify: '',
      phone: '',
      openid: '',
      kindofSchool: '',
      class: '',
      email: '',
      flag: false,
      room: '',
      randomMath: ''
    }],
    acceptMemberList: [],
    barInfo: app.globalData.barInfo,
    //跳转方式
    toNavigateFlag: false

  },


//跳转
  toNavigate(){
    if (this.data.toNavigateFlag) {
      wx.redirectTo({
        url: '../lookReservation/lookReservation',
      })
      return
    }
    wx.redirectTo({
      url: '../examInform/examInformList',
    })
  },

  //初始化一些重要数据
  initFunction(){
    //报名地点：随机一个出来
    //内置好科目
    //内置好时间
    let that = this
     that.data.place= normalFunction.randomChoiceFromString(this.data.randPlace);
    wx.getStorage({
      key: 'time',
      success: function(res) {
        that.data.time = res.data;
        wx.getStorage({
          key: 'cno',
          success: function(res) {
            that.data.cno = res.data;
            console.log(that.data.place)
          },
          fail: function(error) {
            console.log(error);
          }
        }); 
      },
      fail: function(error) {
        console.log(error);
      }
    });    
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    wx.showLoading({
      title:'加载中',
      mask:true
    })
    this.initFunction()
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {
    wx.hideLoading()
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