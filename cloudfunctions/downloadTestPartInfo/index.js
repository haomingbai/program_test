// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

const xlsx = require('node-xlsx');

const db = cloud.database()

const _ = db.command

// 云函数入口函数

//传入testInfo参数作为考场的_id
exports.main = async (event, context) => {
  try{
    var testInfo = event.testInfo
    const base = await db.collection('test_studentForm').doc(testInfo).get()
    const originalData = base.data;
    //return base.data
    let sheetData = [];
    sheetData.push([testInfo,"",""])
    sheetData.push(["学号","姓名","签到状态"])
    for(var i = 0; i < originalData.student.length; i++){
      let row = [];
      row.push(originalData.student[i]._id);
      row.push(originalData.student[i].name);
      row.push(originalData.isSigned[i]?'已签到':'未签到');
      sheetData.push(row)
    }

    var buffer = xlsx.build([{
      name: 'sheet1',
      data: sheetData
    }])

    let path = new Date().getTime()
    let result = await cloud.uploadFile({
      cloudPath: path + '.xlsx',
      fileContent: buffer
    })
    return result
  } catch (e) {
    return "傻逼函数炸了还不报错"
  }
}