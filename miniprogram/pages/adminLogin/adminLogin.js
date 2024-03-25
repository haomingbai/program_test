// pages/adminLogin/adminLogin.js

wx.cloud.init()

const db = wx.cloud.database()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    password: "",
    account:{},
    loginResult:"",
    permitted: false
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

  adminLogin: function () {
    const that = this;
    //console.log(that.data.accountInfo);
    db.collection("admin_insertForm").where(
      {
        accountInfo: that.data.accountInfo
      }
    ).get().then(
      res => {
        //console.log(res.data)
        if(res.data.length == 0){
          that.setData({
            loginResult: "登陆失败，请检查账户密码或者咨询技术人员"
          })
          wx.showToast({
            title: '登陆失败',
          })
        }else if(res.data[0].password == that.data.password){
          that.setData({
            loginResult: "登陆成功，请享用！",
            permitted: true
          })
          wx.showToast({
            title: '登陆成功',
          })
        }else{
          that.setData({
            loginResult: "登陆失败，请检查账户密码或者咨询技术人员"
          })
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
        that.data.loginResult = "登陆失败，请检查您的账户和密码或者咨询技术人员。"
        console.log(res)
      }
    )
  },

  resolvExcel(fileId) {
    wx.cloud.callFunction({
      name: "excel",
      data:{
        fileID: fileId
      }
    }).then(
      res => {
        console.log("succeed",res)
      }
    ).catch(
      res => {
        console.log("Fail",res)
      }
    )
  },

  uploadExcel(path) {
    let that = this;
    wx.cloud.uploadFile({
      cloudPath: new Date().getTime() + '.xls',
      filePath: path
    }).then(
      res => {
        console.log("Successfully Update",res);
        that.resolvExcel(res.fileID);
      }
    ).catch(
      err => {
        console.log("Upload Failed",err)
      }
    )
  },

  chooseExcel() {
    let that = this;
    wx.chooseMessageFile({
      count: 1,
      type: 'file'
    }).then(
      res => {
        let path = res.tempFiles[0].path;
        console.log("Successfully Chosen Files",path)
        that.uploadExcel(path)
      }
    )
  }
})