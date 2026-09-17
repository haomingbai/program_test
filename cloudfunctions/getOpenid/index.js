const cloud = require('wx-server-sdk')
cloud.init()

const db = cloud.database()
const _ = db.command

exports.main = async () => {
  try {
    // 1️⃣ 找出 test_partInfo 中包含 "III" 但不包含 "III实验" 的记录
    const partInfo = await db.collection('test_partInfo').where({
      courseID: _.and([
        db.RegExp({ regexp: "III" }),
        _.not(db.RegExp({ regexp: "III实验" }))
      ])
    }).get()

    // 提取 courseID 列表
    const targetIDs = partInfo.data.map(x => x.courseID)

    // 2️⃣ 删除 test_partInfo 中这些记录
    const removePartInfo = await db.collection('test_partInfo')
      .where({
        courseID: _.in(targetIDs)
      })
      .remove()

    // 3️⃣ 删除 test_studentForm 中 _id 和上面相同内容的记录
    const removeStudentForm = await db.collection('test_studentForm')
      .where({
        _id: _.in(targetIDs)
      })
      .remove()

    return {
      success: true,
      matched: targetIDs,
      removePartInfo: removePartInfo.stats.removed,
      removeStudentForm: removeStudentForm.stats.removed
    }
  } catch (err) {
    console.error(err)
    return { success: false, error: err }
  }
}
