const app = getApp()
//const cloudFunction = require("../../commonFunction/cloudFunction")

wx.cloud.init();

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
    barInfo: app.globalData.barInfo,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function (options) {
    const that =  this;
    //console.log(options);
    let courseID = options.courseID;
    //console.log(courseID);
    await wx.cloud.callFunction({
      name: 'getCourse',
      data: {
        courseID: courseID
      }
    }).then(
      async res => {
        let f = await res.result;
        console.log(f);
        if(f.length){
          that.setData({
            list: f
          })
        } else {
          wx.showToast({
            title: '错误',
            mask: true
          })
        }
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

  toNavigate: function () {
    wx.navigateBack({
      delta: 2
    })
  },

  reserveTest: function (event) {
    //console.log(event.currentTarget.dataset.testinfo);
    wx.showLoading({
      title: '报名中',
      mask: true
    })
    let testInfo = event.currentTarget.dataset.testinfo;
    this.setData({
      flag: false
    })
    //console.log(testInfo)
    const studentID = wx.getStorageSync('studentID')
    wx.cloud.callFunction({
      name: 'reserveTest',
      data: {
        event: testInfo,
        context: studentID
      }
    }).then(
      res => {
        console.log(res);
        wx.showToast({
          title: '报名成功',
          mask: true
        })
        sleep(1000)
        wx.reLaunch({
          url: '../index/index',
        })
        wx.hideLoading()
      }
    ).catch(
      err => {
        console.log(err);
        wx.hideLoading()
        wx.showToast({
          title: '报名失败',
          mask: true
        })
      }
    )
  },
  
})