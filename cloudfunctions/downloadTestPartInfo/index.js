// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
}) // 使用当前云环境

const xlsx = require('node-xlsx');

const db = cloud.database()

const _ = db.command

// 云函数入口函数

//传入testInfo参数作为考场的_id
exports.main = async (event, context) => {
  try {

    var testInfo = event.testInfo

    const base = await db.collection('test_studentForm').doc(testInfo).get()
    const originalData = base.data;
    //return base.data
    let sheetData = [];

    sheetData.push([testInfo, "", "", ""])

    // 座位列永远存在; 学生项缺少 seat 字段时 (座位号尚未生成) 留空
    sheetData.push(["座位号", "学号", "姓名", "学院", "班级", "签到状态"])
    const seen = new Set();
    for (var i = 0, dat, cl; i < originalData.student.length; i++) {
      const sid = originalData.student[i]._id;
      if (seen.has(sid)) continue;
      seen.add(sid);

      let row = [];
      const seat = originalData.student[i].seat;
      row.push(seat === undefined || seat === null ? "" : seat);
      row.push(sid);
      row.push(originalData.student[i].name);
      //Pay attention that var cl should be deleted when coping with the enrollment of competition, and the related vars shold be modified.
      let cl = await db.collection('student_reserve').doc(sid).get();

      if (cl.data.school) {
        let school = cl.data.school;
        row.push(school);
      } else {
        row.push("");
      }

      // 班级
      if (cl.data.classID) {
        let classTemp = cl.data.classID;
        row.push(classTemp);
      } else {
        let classTemp = cl.data.password.substring(10);
        row.push(classTemp);
      }

      if (originalData.student[i].isSigned) {
        dat = '已签到';
      } else {
        dat = '未签到';
      }
      row.push(dat);
      //sheetData.push([originalData.student[i]._id,originalData.student[i].name,originalData.isSigned[i]?'已签到':'未签到'])
      sheetData.push(row);
    }
    //if(!sheetData){throw sheetData;}

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
    return {
      err: e,
      msg: "Fail to get file!"
    }
  }
}