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
    
    sheetData.push([testInfo,"","",""])
    
    sheetData.push(["学号","姓名", "学院","班级","签到状态"])
    for(var i = 0,dat,cl; i < originalData.student.length; i++){
      let row = [];
      row.push(originalData.student[i]._id);
      row.push(originalData.student[i].name);
      //Pay attention that var cl should be deleted when coping with the enrollment of competition, and the related vars shold be modified.
      let cl = await db.collection('student_reserve').doc(originalData.student[i]._id).get();

      if (cl.data.school) {
        let school = cl.data.school;
        row.push(school);
      } else {
        row.push("");
      }
      
      // 班级
      let classTemp = cl.data.password.substring(10);
      row.push(classTemp);
      
      if(originalData.student[i].isSigned) {
        dat = '已签到';
      }else {
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