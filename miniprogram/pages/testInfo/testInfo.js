// pages/testInfo/testInfo.js

wx.cloud.init()

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
    allowCancel: false,
  },

  async refreshShowIndexButton() {
    try {
      const res = await db.collection('content').doc('showIndexButton').get();
      const allowCancelRaw = res?.data?.allowCancel;
      const allowCancel =
        allowCancelRaw === 1 || allowCancelRaw === true || allowCancelRaw === '1';
      this.setData({
        allowCancel,
      });
    } catch (err) {
      console.log(err);
      this.setData({
        allowCancel: false,
      });
      wx.showToast({
        title: '网络错误',
      });
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    const that = this;
    const _id = options._id;
    console.log(_id);
    db.collection('test_partInfo').doc(_id).get().then(
      res => {
        that.setData({
          testInfo: res.data
        })
        // 座位号: 仅当 test_studentForm 中该生的 seat 字段已生成时展示, 否则整个条目隐藏
        that.fetchSeatNumber(res.data)
      }
    ).catch(
      err => {
        console.log(err);
        wx.showToast({
          title: '网络错误',
          mask: true
        })
      }
    );
    db.collection('content').doc("text").get().then(
      res => {
        that.setData({
          reminder: res.data.testInfoReminder
        })
      }
    ).catch(
      err => {
        wx.showToast({
          title: '网络错误',
        })
      }
    )
  },

  // 用 test_partInfo 的 课程+时间+机房 拼出 test_studentForm 的 _id, 从中找到本人记录里的座位号。
  // test_studentForm._id 拼法与 reserveTest / update_test_partInfo 一致: courseID + testTime + roomInfo
  fetchSeatNumber(partInfo) {
    const that = this;
    if (!partInfo || !partInfo.courseID || !partInfo.testTime || !partInfo.roomInfo) {
      return;
    }
    const formID = partInfo.courseID + partInfo.testTime + partInfo.roomInfo;
    const studentID = wx.getStorageSync('studentID');
    db.collection('test_studentForm').doc(formID).get().then(
      res => {
        const students = res.data && res.data.student;
        if (!Array.isArray(students) || !studentID) {
          return;
        }
        const mine = students.find(s => s && s._id === studentID);
        if (mine && mine.seat !== undefined && mine.seat !== null) {
          that.setData({
            seatNumber: mine.seat,
            hasSeat: true
          })
        }
      }
    ).catch(
      err => {
        // 考场表不存在或权限问题等情况, 一律静默不展示座位号
        console.log('fetchSeatNumber:', err);
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
    this.refreshShowIndexButton();
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

  cancelReservation: function () {
    const that = this;
    wx.showLoading({
      title: '处理中',
      mask: true
    })
    const id = that.data.testInfo._id;
    wx.cloud.callFunction({
      name: "cancelReservation",
      data: {
        id: id,
        studentID: wx.getStorageSync('studentID')
      }
    }).then(
      res => {
        console.log(res);
        wx.hideLoading()
        wx.showToast({
          title: '取消成功',
          mask: true
        })
        sleep(1000);
        wx.switchTab({
          url: '../lookReservation/lookReservation',
        }).then(
          e => {
            var page = getCurrentPages().pop();
            if (page == undefined || page == null) return;
            page.onLoad();
          }
        )
      }
    ).catch(
      err => {
        console.log(err)
        wx.hideLoading()
        wx.showToast({
          title: '取消失败',
          mask: true
        })
      }
    )
  }
})