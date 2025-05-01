// pages/teacherLogin/teacherLogin.js

const QR = require('../../utils/weapp-qrcode.js')

wx.cloud.init();

const db = wx.cloud.database();

const _ = db.command

Page({

  /**
   * 页面的初始数据
   */
  data: {
    logined: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    const that = this;
    if(options.courseID && options.testTime && options.roomInfo) {
      that.setData({
        getCourse: true
      })
      let courseID = options.courseID, testTime = options.testTime, roomInfo = options.roomInfo
      db.collection(test_partInfo).where({
        courseID: courseID,
        testTime: testTime,
        roomInfo: roomInfo
      }).get().then(
        res => {
          that.setData({
            course: res.data
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

  SwitchA(e) {
    this.switchA = e.detail.value
  },
  SwitchB(e) {
    this.switchB = e.detail.value
  },
  SwitchC(e) {
    this.switchC = e.detail.value
  },
  SwitchD(e) {
    this.switchD = e.detail.value
  },

  refreshCourseID (e) {
    //console.log(e)
    let i = e.detail.value;
    const that =  this;
    that.setData({
      courseID: i.trim()
    })
    //console.log(i)
  },

  refreshUsername (e) {
    //console.log(e)
    let i = e.detail.value;
    const that =  this;
    that.setData({
      username: i.trim()
    })
    //console.log(i)
  },

  refreshPassword (e) {
    //console.log(e)
    let i = e.detail.value;
    const that =  this;
    that.setData({
      password: i.trim()
    })
    //console.log(i)
  },

  fetchCourse() {
    let that = this;
    wx.showLoading({
      title: '请稍候',
      mask: true
    })
    wx.cloud.callFunction({
      name: 'getCourse',
      data: {
        courseID: that.data.courseID
      }
    }).then(
      res => {
        that.setData({
          course: res.result,
        })
        console.log(res)
        wx.hideLoading();
      }
    ).catch(
      err => {
        console.log(err)
        wx.hideLoading();
        wx.showToast({
          title: '网络错误',
        })
      }
    )
  },

  inquireTest(e) {
    const that = this;
    that.setData({
      getCourse: true
    });
    //console.log(e)
    const _id = e.currentTarget.dataset.index;
    this.setData({
      course: [e.currentTarget.dataset.value]
    })
  },

  loginSystem:async function () {
    const that = this;
    await db.collection('test_partInfo').doc(that.data.course[0]._id).get().then(
      async res => {
        if(that.data.password == res.data.teacherPassword && that.data.username == res.data.teacherID) {
          that.setData({
            logined: true,
          })
          //console.log(res)
          wx.showLoading({
            title: '请稍候',
            mask: true
          })
          await db.collection('test_studentForm').doc(res.data.courseID+res.data.testTime+res.data.roomInfo).get().then(
            async res => {
              let student = await res.data.student;
              console.log(student);
              that.setData({
                student: student
              })
            }
          )
          wx.hideLoading();
        } else {
          wx.showToast({
            title: '用户名或密码错误',
          })
        }
      }
    )
  },
  switchA: function (e) {
    const that = this;
    let dat = {
      index: e.currentTarget.dataset.index,
      value: e.detail.value ? true:false
    }
    let room = that.data.course[0].courseID + that.data.course[0].testTime + that.data.course[0].roomInfo
    db.collection('test_studentForm').doc(room).update({
      data: {
        ['student.'+[dat.index]+".isSigned"]: dat.value
      }
    }).then(
      res => {
        that.setData({
          ['isSigned['+dat.index+'].isSigned']: dat.value
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
  },
  getFile() {
    wx.showLoading({
      title: '请稍候',
      mask: true
    })
    const that = this;
    const room = that.data.course[0].courseID + that.data.course[0].testTime + that.data.course[0].roomInfo;
    wx.cloud.callFunction({
      name: 'downloadTestPartInfo',
      data: {
        testInfo: room
      }
    }).then(
      async res => {
        let fileID = res.result.fileID;
        console.log(res);
        await wx.cloud.downloadFile({
          fileID: fileID
        }).then(
          async result => {
            let filePath = result.tempFilePath;
            wx.openDocument({
              filePath: filePath,
              showMenu: true
            })
          }
        )
        wx.cloud.deleteFile({
          fileList: [fileID]
        })
        wx.hideLoading();
      }
    ).catch(
      err => {
        console.log(err);
        wx.hideLoading();
        wx.showToast({
          title: '获取超时',
          mask: true
        })
      }
    )
  },
  getQrCode() {
    let that = this;
    let room = that.data.course[0].courseID + that.data.course[0].testTime + that.data.course[0].roomInfo;
    var imageData = QR.drawImg(room,
      {
        typeNumber: 4,
        errorCorrectLevel: 'M',
        size: 500
      })
    this.setData({
      qrcodeURL: imageData
    })
  }
})