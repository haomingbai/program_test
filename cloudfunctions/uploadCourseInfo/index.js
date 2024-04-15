// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

const db = cloud.database({
  throwOnNotFound: false,
})

var xlsx = require('node-xlsx');

const _ = db.command;

function extractCourseName(inputString) {
    // 假设输入的字符串格式为 "课程名称：[课程名]"
    const startIndex = inputString.indexOf("：") + 1;
    if (startIndex !== -1) {
        return inputString.substring(startIndex);
    } else {
        return "未找到有效的课程名称";
    }
}


// 云函数入口函数
exports.main = async(event, context) => {
  let {
    fileID
  } = event
  //1,通过fileID下载云存储里的excel文件
  const res = await cloud.downloadFile({  
    fileID: fileID,
  })
  const buffer = res.fileContent

  let tmp = [];

  let tasks = [] //用来存储所有的添加数据操作
  //2,解析excel文件里的数据
  var sheets = xlsx.parse(buffer); //获取到所有sheets

  for(const sheet of sheets) {
    let rowId = 0;
    var courseID = "",len = sheet.data.length;
    for(const row of sheet.data) {
      if(rowId == 1) {
        courseID = extractCourseName(row[0]).trim();
      } else if(rowId > 4&&rowId < len-1) {
        tmp.push('exec');
        let promise = (async (row,courseID) => {
          let _id = ''
          if(typeof(row[1]) != String) {
            _id = row[1].toString().trim()
          } else {
            _id = row[1].trim()
          }
          const search = await db.collection('student_reserve').doc(_id).get();
          if(search.data) {
            await db.collection('student_reserve').doc(_id).update({
              data: {
                selectedCourses: _.addToSet(courseID)
              }
            })
          } else {
            let name = row[2].trim(),password = row[1].trim()+row[6].trim(),selectedCourses = [courseID]
            await db.collection('student_reserve').add({
              data: {
                _id: _id,
                name: name,
                password: password,
                selectedCourses: selectedCourses,
                roomID: []
              }
            })
          }
        })(row,courseID)
        tasks.push(promise);
      }
      rowId ++;
    }
  }

  const result = await Promise.all(tasks).then(
    res => {
      return res;
    }
  ).catch(
    err => {
      return err
    }
  )
  // 等待所有数据添加完成
  //await Promise.all(tasks)
  return result;
}