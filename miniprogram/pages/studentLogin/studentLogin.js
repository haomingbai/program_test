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
    studentID: "",
    attributes: {}
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
          console.log('student_reserve 查询失败：', err);
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
        wx.reLaunch({
          url: '../index/index',
        })
      }
    )
    wx.showLoading({
      title: '加载中',
      mask: true
    })
    db.collection('content').doc('showIndexButton').get().then(
      res => {
        this.setData({
          register: res.data.register
        })
        wx.hideLoading()
      }
    ).catch(
      res => {
        wx.hideLoading()
        wx.showToast({
          title: '网络错误',
        })
        wx.reLaunch({
          url: '../index/index',
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
            wx.switchTab({
              url: '../personalInfo/personalInfo',
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
  },

  unifiedLogin: function(event) {
    console.log("Navigate to UIS login page...");
    wx.navigateTo({
      url: '../uis/uis',
    }).then(res => {
      console.log(res);
    }).catch(
      err => {
        console.log(err);
      }
    )
  },

  nextStep: async function() {
    console.log(this.data.studentID);
    console.log(this.data.attributes);
    try {
      // 等待云函数完成（内部含自动注册：student_reserve 无此学生时会创建文档）
      const res = await wx.cloud.callFunction({
        name: "updateStudentPersonalInfo",
        data: {
          studentID: this.data.studentID,
          school: this.data.attributes.organizationname[0],
          identityType: this.data.attributes.identitytypename[0],
          name: this.data.attributes.name[0],
        }
      });
      console.log(res);
      if (!res.result || !res.result.success) {
        console.error('updateStudentPersonalInfo 失败：', res.result && res.result.err);
      }
    } catch (err) {
      console.log(err);
    }
    wx.hideLoading();
    wx.setStorageSync('studentID', this.data.studentID);
    wx.setStorageSync('studentName', this.data.attributes.name[0]);
    this.onLoad();
  }
})