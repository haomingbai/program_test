const app = getApp()
//const cloudFunction = require("../../commonFunction/cloudFunction")

wx.cloud.init();

const db = wx.cloud.database();

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
    const that =  this;
    //console.log(options);
    let courseID = options.courseID;
    //console.log(courseID);
    db.collection('test_partInfo').where({
      courseID: courseID
    }).get().then(
      async res => {
        if(res.data.length == 0){
          that.setData({
            flag: true
          });
        } else {
          const form = [], info = res.data;
          for(const it of info){
            //console.log(it);
            //console.log(it.courseID+it.testTime+it.roomInfo);
            //console.log(typeof(it.courseID+it.testTime+it.roomInfo));
            await db.collection('test_studentForm').doc(it.courseID+it.testTime+it.roomInfo).get().then(
              res => {
                if(res.data.student.length < res.data.roomVolume){
                  form.push(it);
                }
              }
            ).catch(
              err => {
                wx.showToast({
                  title: '网络错误',
                })
                console.log(err);
              }
            )
          }
          if(form.length){
            that.setData({
              list: form
            })
          } else {
            that.setData({
              flag: true
            })
          }
          //console.log(form.length);
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
    let testInfo = event.currentTarget.dataset.testinfo;
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
      }
    )
  }
})