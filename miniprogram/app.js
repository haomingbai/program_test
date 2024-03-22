// app.js

class studentInfo {
  constructor(){
    this.studentName = "haomingbai";
    this.studentID = "0000000000";
    this.flagUIS = false;
    this.userID = "minihaomingbai";
    this.roomID = "云D534，不服来打架";
  }
}

class teacherInfo {
  constructor(){
    this.accountInfo = "姜老登是**";
    this.password = "7vdbd-dyqkp-gx242-yckmg-khcf9";
  }
}

class courseInfo {
  constructor(){
    this.courseID = "BrainFuck程序设计";
    this.studentID = [];
  }
}

class roomInfo {
  constructor(){
    this.roomInfo = "云D550，有大佬";
    this.testTime = "时间都停了，他们都回来了";
    this.courseID = "BrainFuck程序设计";
    this.studentFormID = "常盘台中学二年级";
    this.QRCode = "https://hlkg.mhedu.sh.cn/";
  }
}

class adminInfo {
  constructor (){
    this.accountInfo = "御坂美琴的宿管";
    this.password = "白井黑子";
    //this.email = "艾尔迪亚网信办邮箱";
    //this.phoneNumber = "姜学锋的手机号";
  }
}

class studentForm {
  constructor(){
    this.serialNumber = [];
    this.studentID = [];
    this.studentName = [];
    this.courseID = "BrainFuck程序设计";
    this.isSigned = [];
  }
}

App({

  /**
   * 当小程序初始化完成时，会触发 onLaunch（全局只触发一次）
   */
  onLaunch: function() {

  },

  /**
   * 当小程序启动，或从后台进入前台显示，会触发 onShow
   */
  onShow: function (options) {
    
  },

  /**
   * 当小程序从前台进入后台，会触发 onHide
   */
  onHide: function () {
    
  },

  /**
   * 当小程序发生脚本错误，或者 api 调用失败时，会触发 onError 并带上错误信息
   */
  onError: function (msg) {
    
  }
})
