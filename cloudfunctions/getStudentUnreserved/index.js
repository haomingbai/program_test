// 云函数入口文件
const cloud = require('wx-server-sdk')
const XLSX = require('xlsx')

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
    // 先批量获取数据，随后在应用层进行健壮的存在性与长度判断
    result = await db.collection("student_reserve")
      .skip(SKIP * cnt).limit(SKIP).get();
    lst = lst.concat(result.data);
    cnt++;
  } while (result.data.length == SKIP);

  // 过滤：在表达式计算前先确保相关元素存在且为数组
  lst = lst.filter(e => Array.isArray(e.selectedCourses) && Array.isArray(e.roomID) && e.roomID.length < e.selectedCourses.length);

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
    const selectedLen = Array.isArray(elem.selectedCourses) ? elem.selectedCourses.length : 0;
    const roomLen = Array.isArray(elem.roomID) ? elem.roomID.length : 0;
    sheetData.push([elem.name || '', elem._id || '', elem.school || '', selectedLen - roomLen]);
  }
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sheetData), "nreservedStus");
  const buff = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  let path = new Date().getTime()
  let uploadResult = await cloud.uploadFile({
    cloudPath: path + "未报名学生表" + '.xlsx',
    fileContent: buff
  })
  return uploadResult;
}