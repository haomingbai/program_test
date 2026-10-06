// pages/adminLogin/adminLogin.js

wx.cloud.init()

const db = wx.cloud.database()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    password: "",
    account: {},
    loginResult: "",
    permitted: false,
    necessaryInformation: ""
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function (options) {
    const data = await db.collection('content').doc('showIndexButton').get();
    this.setData({
      dangerousFunction: data.data.dangerousFunction
    })
    console.log(data)
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

  refreshAccountInfo(x) {
    let i = x.detail.value;
    this.setData({
      accountInfo: i.trim()
    });
  },
  refreshPassword(x) {
    let i = x.detail.value;
    this.setData({
      password: i.trim()
    });
  },

  adminLogin: function () {
    const that = this;
    //console.log(that.data.accountInfo);
    wx.showLoading({
      title: '登录中',
      mask: true
    })
    db.collection("admin_insertForm").where({
      accountInfo: that.data.accountInfo
    }).get().then(
      res => {
        //console.log(res.data)
        if (res.data.length == 0) {
          that.setData({
            loginResult: "登陆失败，请检查账户密码或者咨询技术人员"
          })
          wx.showToast({
            title: '登陆失败',
          })
        } else if (res.data[0].password == that.data.password) {
          that.setData({
            loginResult: "登陆成功，请享用！",
            permitted: true
          })
          wx.showToast({
            title: '登陆成功',
          })
        } else {
          that.setData({
            loginResult: "登陆失败，请检查账户密码或者咨询技术人员"
          })
          wx.showToast({
            title: '登陆失败',
          })
        }
        wx.hideLoading()
      }
    ).catch(
      res => {
        wx.hideLoading()
        wx.showToast({
          title: '调用失败',
          icon: 'none'
        })
        that.data.loginResult = "登陆失败，请检查您的账户和密码或者咨询技术人员。"
        console.log(res)
      }
    )
  },

  resolvExcel(fileId) {
    wx.showLoading({
      title: '解析中',
      mask: true
    })
    wx.cloud.callFunction({
      name: "update_test_partInfo",
      data: {
        fileID: fileId
      }
    }).then(
      res => {
        console.log("succeed", res)

        this.setData({
          necessaryInformation: res.result
        })

        wx.cloud.deleteFile({
          fileList: [fileId]
        })
        wx.hideLoading()
        wx.showToast({
          title: '解析完成',
          icon: 'success'
        })
      }
    ).catch(
      res => {
        console.log("Fail", res)

        wx.cloud.deleteFile({
          fileList: [fileId]
        })
        wx.hideLoading()
        wx.showToast({
          title: '调用失败',
          icon: 'none'
        })
      }
    )
  },

  // 批量上传并解析考场信息
  uploadExcelBatch: async function (paths) {
    wx.showLoading({
      title: '批量上传中',
      mask: true
    })
    const uploaded = []
    try {
      // 上传所有文件
      for (const p of paths) {
        const res = await wx.cloud.uploadFile({
          cloudPath: new Date().getTime() + '.xls',
          filePath: p
        })
        uploaded.push(res.fileID)
      }
      // 逐个解析
      for (const fileID of uploaded) {
        await wx.cloud.callFunction({
          name: 'update_test_partInfo',
          data: {
            fileID
          }
        })
        // 解析完成后删除云文件
        await wx.cloud.deleteFile({
          fileList: [fileID]
        }).catch(() => {})
      }
      wx.hideLoading()
      wx.showToast({
        title: '全部完成',
        icon: 'success'
      })
    } catch (err) {
      console.log('Batch upload/parse failed', err)
      // 失败时清理所有已上传的文件，忽略删除错误继续
      for (const fileID of uploaded) {
        try {
          await wx.cloud.deleteFile({
            fileList: [fileID]
          })
        } catch (e) {
          /* ignore */
        }
      }
      wx.hideLoading()
      wx.showToast({
        title: '处理失败',
        icon: 'none'
      })
    }
  },

  chooseExcel() {
    const that = this
    wx.chooseMessageFile({
      count: 9,
      type: 'file'
    }).then(res => {
      const paths = res.tempFiles.map(t => t.path)
      console.log('Chosen files', paths)
      that.uploadExcelBatch(paths)
    })
  },

  resolvStudentForm(fileId) {
    wx.showLoading({
      title: '解析中',
      mask: true
    })
    wx.cloud.callFunction({
      name: "uploadCourseInfo",
      data: {
        fileID: fileId
      }
    }).then(
      res => {
        console.log("succeed", res)

        this.setData({
          necessaryInformation: res.result
        })

        wx.cloud.deleteFile({
          fileList: [fileId]
        })
        wx.hideLoading()
        wx.showToast({
          title: '解析完成',
          icon: 'success'
        })
      }
    ).catch(
      res => {
        console.log("Fail", res)

        wx.cloud.deleteFile({
          fileList: [fileId]
        })
        wx.hideLoading()
        wx.showToast({
          title: '调用失败',
          icon: 'none'
        })
      }
    )
  },

  // 批量上传并解析学生选课信息
  uploadStudentFormBatch: async function (paths) {
    wx.showLoading({
      title: '批量上传中',
      mask: true
    })
    const uploaded = []
    try {
      for (const p of paths) {
        const res = await wx.cloud.uploadFile({
          cloudPath: new Date().getTime() + '.xls',
          filePath: p
        })
        uploaded.push(res.fileID)
      }
      for (const fileID of uploaded) {
        await wx.cloud.callFunction({
          name: 'uploadCourseInfo',
          data: {
            fileID
          }
        })
        await wx.cloud.deleteFile({
          fileList: [fileID]
        }).catch(() => {})
      }
      wx.hideLoading()
      wx.showToast({
        title: '全部完成',
        icon: 'success'
      })
    } catch (err) {
      console.log('Batch upload/parse failed', err)
      for (const fileID of uploaded) {
        try {
          await wx.cloud.deleteFile({
            fileList: [fileID]
          })
        } catch (e) {
          /* ignore */
        }
      }
      wx.hideLoading()
      wx.showToast({
        title: '处理失败',
        icon: 'none'
      })
    }
  },

  chooseStudentForm() {
    const that = this
    wx.chooseMessageFile({
      count: 30,
      type: 'file'
    }).then(res => {
      const paths = res.tempFiles.map(t => t.path)
      console.log('Chosen files', paths)
      that.uploadStudentFormBatch(paths)
    })
  },

  resolvCourseInfo(fileId) {
    wx.showLoading({
      title: '解析中',
      mask: true
    })
    wx.cloud.callFunction({
      name: "update_test_partInfo",
      data: {
        fileID: fileId
      }
    }).then(
      res => {
        console.log("succeed", res)

        this.setData({
          necessaryInformation: res.result
        })

        wx.cloud.deleteFile({
          fileList: [fileId]
        })
        wx.hideLoading()
        wx.showToast({
          title: '解析完成',
          icon: 'success'
        })
      }
    ).catch(
      res => {
        console.log("Fail", res)

        wx.cloud.deleteFile({
          fileList: [fileId]
        })
        wx.hideLoading()
        wx.showToast({
          title: '调用失败',
          icon: 'none'
        })
      }
    )
  },

  uploadCourseInfo(path) {
    let that = this;
    wx.showLoading({
      title: '上传中',
      mask: true
    })
    wx.cloud.uploadFile({
      cloudPath: new Date().getTime() + '.xls',
      filePath: path
    }).then(
      res => {
        console.log("Successfully Update", res);
        that.resolvCourseInfo(res.fileID);
        wx.hideLoading()
        wx.showToast({
          title: '上传成功',
          icon: 'success'
        })
      }
    ).catch(
      err => {
        console.log("Upload Failed", err)
        wx.hideLoading()
        wx.showToast({
          title: '调用失败',
          icon: 'none'
        })
      }
    )
  },

  chooseCourseInfo() {
    let that = this;
    wx.chooseMessageFile({
      count: 30,
      type: 'file'
    }).then(
      res => {
        let path = res.tempFiles[0].path;
        console.log("Successfully Chosen Files", path)
        that.uploadCourseInfo(path)
      }
    )
  },

  clearAll() {
    wx.showLoading({
      title: '执行中',
      mask: true
    })
    wx.cloud.callFunction({
      name: 'clearDataBase'
    }).then(
      res => {
        wx.showToast({
          title: res.result.success ? '完成！' : '失败！',
        })
        console.log(res)
        wx.hideLoading()
      }
    ).catch(
      err => {
        wx.hideLoading()
        wx.showToast({
          title: '调用失败',
          icon: 'none'
        })
        console.log(err)
      }
    )
  },

  maskAll() {
    wx.showLoading({
      title: '执行中',
      mask: true
    })
    wx.cloud.callFunction({
      name: 'maskDataBase'
    }).then(
      res => {
        wx.showToast({
          title: res.result.success ? '完成！' : '失败！',
        })
        console.log(res)
        wx.hideLoading()
      }
    ).catch(
      err => {
        wx.hideLoading()
        wx.showToast({
          title: '调用失败',
          icon: 'none'
        })
        console.log(err)
      }
    )
  },

  getUnreserved: function (event) {
    wx.showLoading({
      title: '请稍候',
      mask: true
    })
    wx.cloud.callFunction({
      name: 'getStudentUnreserved',
      data: {}
    }).then(
      async res => {
        const fileID = res.result.fileID;
        await wx.cloud.downloadFile({
          fileID: fileID
        }).then(async result => {
          let filePath = result.tempFilePath;
          wx.openDocument({
            filePath: filePath,
            showMenu: true
          })
          console.log(filePath)
          wx.cloud.deleteFile({
            fileList: [fileID]
          })
          wx.hideLoading()
          wx.showToast({
            title: '获取成功',
            icon: 'success'
          })
        })
      }
    ).catch(
      err => {
        console.log(err);
        wx.hideLoading()
        wx.showToast({
          title: '调用失败',
          icon: 'none'
        })
      }
    )
  },

  // 下载全部签到表
  async fetchAllTestPartInfo() {
    const coll = db.collection('test_partInfo')
    const countRes = await coll.count()
    const total = (countRes && typeof countRes.total === 'number') ? countRes.total : 0
    const pageSize = 20
    const pages = Math.ceil(total / pageSize) || 1
    const all = []
    for (let i = 0; i < pages; i++) {
      const res = await coll
        .field({
          courseID: true,
          testTime: true,
          roomInfo: true
        })
        .skip(i * pageSize)
        .limit(pageSize)
        .get()
      if (res && Array.isArray(res.data)) all.push(...res.data)
    }
    return all
  },

  // 为考场列表逐场生成座位号, 返回失败场次数。
  // 单场失败不中断, 失败考场的导出表格座位号列将留空。
  async generateSeatNumbersForRooms(rooms) {
    let failed = 0
    for (let i = 0; i < rooms.length; i++) {
      wx.showLoading({
        title: `座位号${i + 1}/${rooms.length}`,
        mask: true
      })
      try {
        const res = await wx.cloud.callFunction({
          name: 'generateSeatNumber',
          data: {
            testInfo: rooms[i]
          }
        })
        if (!(res && res.result && res.result.success)) failed++
      } catch (err) {
        console.log('generateSeatNumber failed for', rooms[i], err)
        failed++
      }
    }
    return failed
  },

  // 生成全部座位号 (可单独执行, downloadAllTestPartInfo 导出前也会先调这一步)
  async generateAllSeatNumbers() {
    wx.showLoading({
      title: '准备中',
      mask: true
    })
    try {
      const listRes = await wx.cloud.callFunction({
        name: 'downloadAllTestPartInfo',
        data: {}
      })
      const rooms = (listRes && listRes.result && Array.isArray(listRes.result.testInfos)) ?
        listRes.result.testInfos :
        []
      if (!rooms.length) {
        wx.hideLoading()
        wx.showToast({
          title: '暂无考场信息',
          icon: 'none'
        })
        return
      }

      const failed = await this.generateSeatNumbersForRooms(rooms)
      wx.hideLoading()
      if (failed) {
        console.log('generateSeatNumber failed count:', failed)
        wx.showToast({
          title: `${failed}场未生成`,
          icon: 'none'
        })
      } else {
        wx.showToast({
          title: '座位号已生成',
          icon: 'success'
        })
      }
    } catch (err) {
      console.log(err)
      wx.hideLoading()
      wx.showToast({
        title: '调用失败',
        icon: 'none'
      })
    }
  },

  // 说明：小程序端无法直接使用 node-xlsx（它是 Node 生态模块）。
  // 这里改为：先从 downloadAllTestPartInfo 云函数拿到全部考场列表，
  // 再在小程序端循环调用 downloadTestPartInfo 云函数，逐个下载/打开/删除分表，避免一次性云函数超时。
  // 导出前会先逐场生成座位号：先生成，再导出。
  async downloadAllTestPartInfo() {
    wx.showLoading({
      title: '准备中',
      mask: true
    })
    try {
      const fs = wx.getFileSystemManager()

      const sanitizeFileName = (name) => {
        const s = (name == null) ? '' : String(name)
        // Windows/通用文件名非法字符：\ / : * ? " < > |，以及控制字符
        return s
          .replace(/[\\/\:\*\?\"\<\>\|]/g, '_')
          .replace(/[\u0000-\u001F]/g, '_')
          .replace(/\s+/g, '')
          .replace(/_+/g, '_')
          .replace(/^\.+/, '')
          .slice(0, 80) ||
          'signin'
      }

      const listRes = await wx.cloud.callFunction({
        name: 'downloadAllTestPartInfo',
        data: {}
      })
      const rooms = (listRes && listRes.result && Array.isArray(listRes.result.testInfos)) ?
        listRes.result.testInfos :
        []

      if (!rooms.length) {
        wx.hideLoading()
        wx.showToast({
          title: '暂无考场信息',
          icon: 'none'
        })
        return
      }

      // 先生成座位号, 再导出; 失败场次的座位号列导出时留空
      const seatFailed = await this.generateSeatNumbersForRooms(rooms)

      const runTs = Date.now()
      const usedNames = new Set()

      for (let i = 0; i < rooms.length; i++) {
        wx.showLoading({
          title: `生成${i + 1}/${rooms.length}`,
          mask: true
        })
        const room = rooms[i]

        let fileID = ''
        try {
          const res = await wx.cloud.callFunction({
            name: 'downloadTestPartInfo',
            data: {
              testInfo: room
            }
          })
          fileID = res && res.result && res.result.fileID ? res.result.fileID : ''
          if (!fileID) continue

          const dl = await wx.cloud.downloadFile({
            fileID
          })

          // 给文档一个可读文件名：序号 + testInfo（清洗）+ 本次批次时间戳，确保不重复。
          const base = `${String(i + 1).padStart(3, '0')}_${sanitizeFileName(room)}`
          let name = base
          let counter = 2
          while (usedNames.has(name)) {
            name = `${base}_${counter}`
            counter++
          }
          usedNames.add(name)
          const savedPath = `${wx.env.USER_DATA_PATH}/${name}_${runTs}.xlsx`
          await new Promise((resolve, reject) => {
            fs.copyFile({
              srcPath: dl.tempFilePath,
              destPath: savedPath,
              success: resolve,
              fail: reject
            })
          })

          await new Promise((resolve, reject) => {
            wx.openDocument({
              filePath: savedPath,
              fileType: 'xlsx',
              showMenu: true,
              success: resolve,
              fail: reject
            })
          })
        } finally {
          // 尽量清理云端临时文件（即使打开失败也尝试删除）
          if (fileID) {
            await wx.cloud.deleteFile({
              fileList: [fileID]
            }).catch(() => {})
          }
        }
      }

      wx.hideLoading()
      if (seatFailed) {
        console.log('generateSeatNumber failed count:', seatFailed)
        wx.showToast({
          title: '已生成,座位有缺',
          icon: 'none'
        })
      } else {
        wx.showToast({
          title: '已生成',
          icon: 'success'
        })
      }
    } catch (err) {
      console.log(err)
      wx.hideLoading()
      wx.showToast({
        title: '调用失败',
        icon: 'none'
      })
    }
  }
})