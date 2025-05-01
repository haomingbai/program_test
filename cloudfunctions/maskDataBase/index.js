// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

const db = cloud.database();

const _ = db.command;

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    await db.collection('student_reserve').where({
      _id: _.neq(null)
    }).remove()
    await db.collection('test_partInfo').where({
      _id: _.neq(null)
    }).update({
      data: {
        mask: true
      }
    })
    return {
      success: true
    }
  } catch(e) {
    return {
      success: false,
      error: e
    }
  }
}