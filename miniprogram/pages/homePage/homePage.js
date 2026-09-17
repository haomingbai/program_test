var app = getApp();

wx.cloud.init()

const db = wx.cloud.database();

//const normalFunction = require('../../commonFunction/normalFunction')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    barInfo: app.globalData.barInfo,
    allowReservation: false,
  },

  async refreshShowIndexButton() {
    try {
      const res = await db.collection('content').doc('showIndexButton').get();
      const allowReservationRaw = res?.data?.allowReservation;
      const allowReservation =
        allowReservationRaw === 1 ||
        allowReservationRaw === true ||
        allowReservationRaw === '1';
      this.setData({
        allowReservation,
      });
    } catch (err) {
      console.log(err);
      this.setData({
        allowReservation: false,
      });
      wx.showToast({
        title: '网络错误',
      });
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.setData({
      studentName: wx.getStorageSync('studentName'),
      studentID: wx.getStorageSync('studentID')
    });
    const that = this;
    db.collection('student_reserve').doc(that.data.studentID).get().then(
      res => {
        that.setData({
          Signed: res.data.roomID.length,
          notSigned: res.data.selectedCourses.length-res.data.roomID.length,
        })
        const reserved = res.data.roomID;
        const examForm = [];
        for(var course of res.data.selectedCourses){
          let result = reserved.find(
            item => {
              return item.courseID === course;
            }
          )
          if(!result){
            examForm.push(course);
          }
        }
        that.setData({
          reserveExam: examForm
        })
      }
    ).catch(
      err => {
        console.log(err);
        wx.showToast({
          title: '网络错误',
        })
      }
    )
    db.collection('content').doc('index').get().then(
      res => {
        this.setData({
          organizationName: res.data.organizationName,
          organizationShortName: res.data.organizationShortName,
          testName: res.data.testName
        })
      }
    ).catch(
      err => {
        wx.showToast({
          title: '网络错误',
        })
        console.log(err);
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
    this.refreshShowIndexButton();
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

  navigateToTabbar (event) {
    console.log(event);
    wx.switchTab({
      url: event.currentTarget.dataset.url,
    }).then(
      e => {
        var page = getCurrentPages().pop();
        if (page == undefined || page == null) return;
        page.onLoad();
      }
    )
  },
  
  changeStats() {
    this.refreshShowIndexButton();
    this.onLoad();
  },

  navigateToExam: function (event) {
    wx.navigateTo({
      url: event.currentTarget.dataset.url+'?courseID='+event.currentTarget.dataset.cno,
    })
  }
})