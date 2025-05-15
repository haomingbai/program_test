// 云函数入口文件
const cloud = require('wx-server-sdk')
const xlsx = require('node-xlsx')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
}) // 使用当前云环境

const db = cloud.database();
const _ = db.command;

// 云函数入口函数
exports.main = async (event, context) => {
  var cnt = 0;
  const SKIP = 100;
  var result;
  var lst = [];
  do {
    result = await db.collection("student_reserve").where(
        _.expr(
          _.lt(
            [
              // 获取 roomID 数组长度
              _.size('$roomID'),
              // 获取 selectedCourses 数组长度
              _.size('$selectedCourses')
            ]
          )
        )
      )
      .skip(SKIP * cnt).limit(SKIP).get();
    lst = lst.concat(result.data);
    cnt++;
  } while (result.data.length == SKIP);

  lst.sort((a, b) => {
    if (a.school < b.school) {
      return -1;
    } else if (a.school == b.school) {
      return 0;
    } else {
      return 1;
    }
  });

  // return lst;

  var sheetData = [
    ["姓名", "学号", "学院", "未预约科目数量"]
  ];
  for (var elem of lst) {
    sheetData.push([elem.name, elem._id, elem.school, elem.selectedCourses.length - elem.roomID.length]);
  }
  const buff = await xlsx.build([{
    name: "nreservedStus",
    data: sheetData
  }]);
  let path = new Date().getTime()
  let uploadResult = await cloud.uploadFile({
    cloudPath: path + "未报名学生表" + '.xlsx',
    fileContent: buff
  })
  return uploadResult;
}