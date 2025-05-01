// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

const db = cloud.database()

var xlsx = require('node-xlsx');

const _ = db.command;

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

  //let result = "课程名 考试时间 考试地点 监考老师用户名 监考老师密码\n";

  //result = '';
  const tasks = [] //用来存储所有的添加数据操作
  //2,解析excel文件里的数据
  var sheets = xlsx.parse(buffer); //获取到所有sheets
  for(const sheet of sheets) {
    //console.log(sheet['name']);
    var calc = 0;
    for (const row of sheet['data']) {
      //console.log(rowId);
      //var row = sheet['data'][rowId]; //第几行数据
      //result.push(rowId);
      if (row && row.length > 0&& calc) { //第一行是表格标题，所有我们要从第2行开始读
        //3，把解析到的数据存到excelList数据表
        const promise = (async (row) => {
          let id = '';
          //console.log(typeof(row[0]));
          //result = typeof(row[0]);
          if(typeof(row[0]) != 'string'){
            id = row[0].toString();
          } else {
            id = row[0]
          }
          const r = await db.collection('student_reserve').where({
            _id: id
          }).get();
          if(r.data.length == 0){
            let t = [];
            let adding = db.collection('student_reserve').add({
              data: {
                _id: id,
                name: row[1],
                password: row[2],
                selectedCourses: [],
                roomID: []
              }
            })
            await adding;
            
            //result += row[0]+' '+row[1]+' '+row[2]+' '+row[3]+' '+row[4]+'\n' ;
            //t.push(adding);
            
          } else {

            updating = db.collection('student_reserve').doc(id).update({
              data: {
                password: row[2]
              }
            })
            await updating;
          }
        })(row);

        //await promise;
        tasks.push(promise);

      }
      calc++;
    }
  }

  result =await Promise.all(tasks).then(
    res => {
      return res;
    }
  ).catch(
    res => {
      return res;
    }
  )
  // 等待所有数据添加完成
  //await Promise.all(tasks)
  return result
}