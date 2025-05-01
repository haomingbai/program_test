// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()

// 云函数入口函数
exports.main = async (event, context) => {
  const db = cloud.database()
  const collectionName = event.collectionName // 通过 event 获取传入的集合名称
  const courseID = event.courseID

  try {
    const res = await db.collection(collectionName).where({test_course:courseID}).get() // 使用传入的集合名称进行数据查询
    return res.data
  } catch (err) {
    console.error(err)
    return err
  }
}
