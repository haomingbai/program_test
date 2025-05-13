// pages/uis/uis.js
Page({

  /**
   * 页面的初始数据
   */
  data: {

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {

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

  webMsg(e) {
    console.log(e)
    wx.showLoading({
      title: '正在验证..',
      mask: true
    })
    console.log("call cas function...");
    wx.cloud.callFunction({
      name: 'cas',
      data: {
        ticket: e.detail.data[0].ticket,
        service: 'https://wzfftx.qxxpz.top/aoxiang.html'
      },
      
    }).then(
      (res) => {
        if (res.result.status) {
          var pages = getCurrentPages()
          // 先回退再调用的，所以直接获取现在页面栈第一个
          var nowPage = pages[pages.length - 1] //上一个页面
          nowPage.setData({
            studentID: res.result.username,
            attributes: res.result.attributes
          })
          nowPage.nextStep();
        } else {
          wx.showToast({
            title: '出错，请联系管理员',
            icon: 'none'
          })
        }
        console.log(res.result);
      }
    ).catch(
      (err) => {
        console.log(err);
      }
    )
  },
  
})