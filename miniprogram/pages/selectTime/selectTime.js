const app = getApp()
const cloudFunction = require("../../commonFunction/cloudFunction")
const normalFunction = require("../../commonFunction/normalFunction")
Page({
  data: {
    barInfo: app.globalData.barInfo,

    TabCur: 0,
    MainCur: 0,
    VerticalNavTop: 0,
    list: [],
    load: true,
    flag: false,
    reserveList: []
  },
  //导航的同时实现一些功能
  navigatorToLogin(e){
    console.log(e.currentTarget.dataset.item)
    normalFunction.setStorageSync('time',e.currentTarget.dataset.item).then(res=>{
      normalFunction.navigateTo('../reservationForm/reservationForm')
    }).catch(error=>{
      normalFunction.showToast('加载错误','error')
    })
  },

  //导航到前面的页去
  toNavigate(){
    normalFunction.navigateTo('../examInform/examInformList')
  },

  initFunction() {
    let that = this
    wx.showLoading({
      title: '加载中...',
      mask: true
    });
    if (wx.getStorageSync('data')) {
      wx.hideLoading()

    } else {
      wx.getStorage({
        key: ['cno'],
        success: function(res) {
          let cno = res.data;
          wx.cloud.callFunction({
            name: 'getInfo',
            data: {
              collectionName: 'test_partInfo', // 传入要查询的集合名
              cno:cno
            },
            success: res => {
              console.log(res.result) // 获取到的数据结果
              let data_database = res.result;
    
              // 提取 test_time 属性并去重
              let testTimeSet = new Set(); // 使用 Set 对象去重
              data_database.map(item => {
                testTimeSet.add(item.test_time);
              });
    
              // 将 Set 对象转化为数组
              let testTimeArray = Array.from(testTimeSet);
              const dateStrings = testTimeArray;
              const dateObjects = dateStrings.map(str => new Date(str));
              for (let i = 0; i < dateObjects.length; i++) {
                // 循环体代码
                if (String(dateObjects[i].getDate()) == '9') {
                  const hours = dateObjects[i].getHours(); // 获取小时数
                  const minutes = dateObjects[i].getMinutes(); // 获取分钟数
                  const time = `${hours}:${minutes}`; // 将小时和分钟拼接为一个整体字符串
                  this.data.reserveList.push(time)
                }
                // if (String(dateObjects[i].getDate()) == '10') {
                // }
              }
              that.setData({
                reserveList:this.data.reserveList
              })
              wx.hideLoading()
            },
            fail: err => {
              console.error(err)
            }
          })
        },
        fail: function(error) {
          console.log(error);
        }
      });
      
      
      



    }

  },

  onLoad() {
    wx.showLoading({
      title: '加载中...',
      mask: true
    });
    let list = [{}];
    normalFunction.getStorageData('cno').then((data) => {
      console.log(data); // 成功获取到数据
      if(data.includes("实验")){
        list[0] = {};
        list[0].name = "01月10日";
        list[0].id = 0;

      }else{
        list[0] = {};
        list[0].name = "01月09日";
        list[0].id = 0;
      }
      this.setData({
        list: list,
        listCur: list[0]
      })
     
    })
    .catch((error) => {
      console.error(error); // 获取数据失败
      normalFunction.showToast('加载错误','error')
    });
  },
  onReady() {
    this.initFunction();
  },
  //导航栏
  tabSelect(e) {
    this.setData({
      TabCur: e.currentTarget.dataset.id,
      MainCur: e.currentTarget.dataset.id,
      VerticalNavTop: (e.currentTarget.dataset.id - 1) * 50
    })
  },

  VerticalMain(e) {
    let that = this;
    let list = this.data.list;
    let tabHeight = 0;
    if (this.data.load) {
      for (let i = 0; i < list.length; i++) {
        let view = wx.createSelectorQuery().select("#main-" + list[i].id);
        view.fields({
          size: true
        }, data => {
          list[i].top = tabHeight;
          tabHeight = tabHeight + data.height;
          list[i].bottom = tabHeight;
        }).exec();
      }
      that.setData({
        load: false,
        list: list
      })
    }
    let scrollTop = e.detail.scrollTop + 20;
    for (let i = 0; i < list.length; i++) {
      if (scrollTop > list[i].top && scrollTop < list[i].bottom) {
        that.setData({
          VerticalNavTop: (list[i].id - 1) * 50,
          TabCur: list[i].id
        })
        return false
      }
    }
  }
})