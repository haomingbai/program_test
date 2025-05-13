// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
}) // 使用当前云环境

const db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  let course = await db.collection('test_partInfo').where({
    courseID: event.courseID
  }).get()
  const data = course.data;

  var res = [];
  for (const element of data) {
    let formID = element.courseID + element.testTime + element.roomInfo;
    try {
      const r = await db.collection('test_studentForm').doc(formID).get()
      const volume = r.data.roomVolume,
        curr = r.data.student.length;
      if (volume > curr) {
        res.push(element);
      }
    } catch (e) {
      console.log(e);
    }
  }
  return res;
}