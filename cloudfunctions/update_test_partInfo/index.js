// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
}) // 使用当前云环境

const db = cloud.database()

var xlsx = require('node-xlsx');

// 云函数入口函数
exports.main = async (event, context) => {
  let {
    fileID
  } = event
  //1,通过fileID下载云存储里的excel文件
  const res = await cloud.downloadFile({
    fileID: fileID,
  })
  const buffer = res.fileContent

  let result = "课程名 考试时间 考试地点 监考老师用户名 监考老师密码\n";

  const tasks = [] //用来存储所有的添加数据操作
  //2,解析excel文件里的数据
  var sheets = xlsx.parse(buffer); //获取到所有sheets
  for (const sheet of sheets) {
    console.log(sheet['name']);
    var calc = 0;
    for (const row of sheet.data) {
      //console.log(rowId);
      //var row = sheet['data'][rowId]; //第几行数据
      //result.push(rowId);
      if (row && row.length > 0 && calc) { //第一行是表格标题，所有我们要从第2行开始读
        //3，把解析到的数据存到excelList数据表
        const promise = (async (row) => {
          var volume = 0;
          if (typeof (row[5]) != 'number') {
            volume = parseInt(row[5]);
          } else {
            volume = row[5];
          }
          const r = await db.collection('test_partInfo').where({
            testTime: row[1].trim(),
            roomInfo: row[2].trim()
          }).get();
          if (r.data.length == 0) {
            let t = [];
            let adding = db.collection('test_partInfo').add({
              data: {
                courseID: row[0].trim(),
                testTime: row[1].trim(),
                roomInfo: row[2].trim(),
                teacherID: row[3].trim(),
                teacherPassword: row[4].trim()
              }
            })

            result += row[0].trim() + ' ' + row[1].trim() + ' ' + row[2].trim() + ' ' + row[3].trim() + ' ' + row[4].trim() + '\n';
            t.push(adding);
            await adding;

            adding = db.collection('test_studentForm').add({
              data: {
                _id: row[0].trim() + row[1].trim() + row[2].trim(),
                roomVolume: volume,
                student: []
              }
            })

            //t.push(adding);

            //await adding;
            await Promise.all(t)

          } else {
            let t = [];

            let del = db.collection('test_studentForm').doc(r.data[0].courseID + r.data[0].testTime + r.data[0].roomInfo).remove();

            t.push(del);

            let update = db.collection('test_partInfo').doc(r.data[0]._id).update({
              data: {
                courseID: row[0].trim(),
                teacherID: row[3].trim(),
                teacherPassword: row[4].trim()
              }
            })
            await update;

            result += row[0].trim() + ' ' + row[1].trim() + ' ' + row[2].trim() + ' ' + row[3].trim() + ' ' + row[4].trim() + '\n';

            t.push(update);
            //await update;

            let adding = db.collection('test_studentForm').add({
              data: {
                student: [],
                roomVolume: volume,
                _id: row[0].trim() + row[1].trim() + row[2].trim(),
              }
            })
            t.push(adding);

            //await update;
            await Promise.all(t);
          }
        })(row);

        //await promise;
        tasks.push(promise);
      }
      calc++;
    }
  }

  let test = await Promise.all(tasks).then(
    res => {
      return res;
    }
  ).catch(
    err => {
      return err;
    }
  )
  // 等待所有数据添加完成
  //await Promise.all(tasks)
  return result
}