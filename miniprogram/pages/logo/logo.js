// pages/logo/logo.js
const db = wx.cloud.database();
const initFunction = require("../../commonFunction/initFunction");
const normalFunction=require("../../commonFunction/normalFunction")
var app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    sname: '',
    sno:'',
    cno:[],
    options: [
      { label: 'C理论', value: 'C理论' ,cnoFlag:false},
      { label: 'C++理论', value: 'C++理论' ,cnoFlag:false},
      { label: 'python理论课', value: 'python理论课' ,cnoFlag:false},
      { label: 'II理论', value: 'II理论' ,cnoFlag:false},
      { label: 'III理论', value: 'III理论' ,cnoFlag:false},
      { label: 'C实验', value: 'C实验' ,cnoFlag:false},
      { label: 'C++实验', value: 'C++实验' ,cnoFlag:false},
      { label: 'python实验', value: 'python实验' ,cnoFlag:false},
      { label: 'II实验', value: 'II实验' ,cnoFlag:false},
      { label: 'III实验', value: 'III实验' ,cnoFlag:false}
    ],
    flagPrivate:false
  },

    /**
   * 处理用户信息，如果没有用户信息就更新数据，不用考虑并发性问题,只有读数据
   **/
  add_update_studentInfo(){
    let that = this
    
    db.collection('student_reserve').where({
      user_openid: app.globalData.openid
    }).get().then(res=>{
      console.log(res)
      if(res.data.length){
        //update
        if(that.data.flagPrivate && that.data.cno.length>0 && that.data.sname.length>0 && that.data.sno.length>0 && app.globalData.openid.length>0){
          db.collection('student_reserve').where({
            user_openid: app.globalData.openid
          }).update({
            data: {
                cno:that.data.cno,
                flag_schoolStu:false,
                sname:that.data.sname,
                sno:that.data.sno,
                test_partInfo_openid:[],
                user_openid:app.globalData.openid
            }
          }).then(res => {
            console.log(res)
            
              normalFunction.showToast("修改成功","");
              normalFunction.switchTab("../persion/persion")
            
            
          }).catch(res=>{
            normalFunction.showToast("修改失败","error");
          })
        }else{
          if(that.data.flagPrivate ==false){
            normalFunction.showToast("请先勾选隐私","error");
          }else{
            normalFunction.showToast("请先完善信息","error");
          }
        }
      }else{
        //add
        //正则判断
        if(that.data.flagPrivate && that.data.cno.length>0 && that.data.sname.length>0 && that.data.sno.length>0 && app.globalData.openid.length>0){
          db.collection('student_reserve').add({
            data:{
              cno:that.data.cno,
              flag_schoolStu:false,
              sname:that.data.sname,
              sno:that.data.sno,
              test_partInfo_openid:[],
              user_openid:app.globalData.openid
            }
          }).then(res=>{
            //成功啦
          normalFunction.showToast("创建成功","");
          normalFunction.switchTab("../persion/persion")

          }).catch(err=>{
            //失败啦
          normalFunction.showToast("创建失败","error");
          })
        }else{
          //失败啦
          if(that.data.flagPrivate ==false){
            normalFunction.showToast("请先勾选隐私","error");
          }else{
            normalFunction.showToast("请先完善信息","error");
          }
          
          

        }
      }
    })
  },


  //隐私权问题
  givePower(){
    this.setData({
      flagPrivate:!this.data.flagPrivate
    })
  },

  //复选功能函数
  handleCheckboxChange: function (event) {
    
    const values = event.detail.value
    console.log(values)
    this.setData({
      cno: values
    })
    console.log('用户选择的选项:', values)
  },

  //初始化函数
  initFunction(){
    let student=wx.getStorageSync('student');
    console.log(student)
    
    //调色
    this.data.options.forEach(item => {
      if (student.cno.includes(item.value)) {
        item.cnoFlag = true;
      }
    });

    this.setData({
      cno:student.cno,
      sname:student.sname,
      sno:student.sno,
      options:this.data.options,
    })
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    //拿缓冲区的数据来给用户显示
    this.initFunction();

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
    this.initFunction();
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