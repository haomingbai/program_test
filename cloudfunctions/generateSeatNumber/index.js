// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database({
  throwOnNotFound: false,
})

// 云函数入口函数
// 给指定考场的 test_studentForm 生成 (或重新生成) 座位号。
//
// 传入参数:
//   event.testInfo  考场 _id, 即 "课程名+考试时间+机房" 拼接串
//                   (与 downloadAllTestPartInfo 返回的 testInfos 一致)
//
// 分配规则:
//   1. 把 student 数组按学号 (_id) 升序排序;
//   2. 依次编号, 写入每项的 seat 字段 (数字, 从 1 开始);
//   3. 整体覆盖回 student 数组。
//   重复调用即为重新生成, 结果幂等。
//
// 注意:
//   studentSignIn 云函数按 student.<index> 下标更新签到状态,
//   因此签到进行期间请不要调用本函数重排数组, 存在下标竞态。
exports.main = async (event, context) => {
  const testInfo = (event && event.testInfo ? String(event.testInfo) : '').trim()
  if (!testInfo) {
    return {
      success: false,
      log: 'Missing parameter: testInfo'
    }
  }

  try {
    const res = await db.collection('test_studentForm').doc(testInfo).get()

    if (!res.data || !Array.isArray(res.data.student)) {
      return {
        success: false,
        log: 'No Form Found! (test_studentForm 中不存在该考场, _id: ' + testInfo + ')'
      }
    }

    const students = res.data.student

    // 按学号升序排序后编号, 同一场次内保证稳定且幂等
    students.sort((a, b) => String(a._id).localeCompare(String(b._id)))
    students.forEach((item, index) => {
      item.seat = index + 1
    })

    await db.collection('test_studentForm').doc(testInfo).update({
      data: {
        student: students
      }
    })

    return {
      success: true,
      count: students.length,
      log: 'Seat numbers generated for ' + testInfo
    }
  } catch (e) {
    return {
      success: false,
      log: e && e.message ? e.message : String(e)
    }
  }
}
