// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

const db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  let ori = await db.collection('test_partInfo').get();
  let result = [];
  for(x of ori.data) {
    await cloud.callFunction({
      name: "downloadTestPartInfo",
      data: {
        testInfo: x.courseID.trim() + x.testTime.trim() + x.roomInfo.trim()
      }
    }).then(
      res => {
        result.push(res.result.fileID);
      }
    ).catch(
      err => {
        console.log(err);
      }
    )
  }
  return result;
}