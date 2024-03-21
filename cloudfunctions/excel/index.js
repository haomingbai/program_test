// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

var xlsx = require('node-xlsx');

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

  const tasks = [] //用来存储所有的添加数据操作
  //2,解析excel文件里的数据
  var sheets = xlsx.parse(buffer); //获取到所有sheets
  sheets.forEach(function(sheet) {
    console.log(sheet['name']);
    for (var rowId in sheet['data']) {
      console.log(rowId);
      var row = sheet['data'][rowId]; //第几行数据
      db.collection('course_sId').where({
        courseID: row[0]
      }).then(
        res => {
          if(res.data.length == 0){
            let course = new courseInfo();
            course.courseID = row[0];
            db.collection('course_sId').add({
              data:course
            })
          }
          if (rowId > 0 && row) { //第一行是表格标题，所有我们要从第2行开始读
            //3，把解析到的数据存到excelList数据表里
            let dat = new roomInfo();
            dat.courseID = row[0];
            dat.testTime = row[1]; //第一列是课程名字，第二列考试时间，第三列考试地点
            dat.testLocation = row[2];
            const promise = db.collection('test_partInfo')
              .add({
                data: dat
              })
            tasks.push(promise)
          }
        }
      )

    }
  });

  // 等待所有数据添加完成
  let result = await Promise.all(tasks).then(res => {
    return res
  }).catch(function(err) {
    return err
  })
  return result
}