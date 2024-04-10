// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

const db = cloud.database({
  // 该参数从 wx-server-sdk 1.7.0 开始支持，默认为 true，指定 false 后可使得 doc.get 在找不到记录时不抛出异常。微信官方文档加了这一段，我也不知道为什么。
  throwOnNotFound: false,
});

const _ = db.command;


// 云函数入口函数
exports.main = async (event, context) => {
  const id = event.id;
  const studentID = event.studentID;
  try{
    const transaction = await db.startTransaction();
    const student = await transaction.collection('student_reserve').doc(studentID).get();
    const test = await transaction.collection('test_partInfo').doc(id).get();
    if(student&&test) {
      const roomID = test.data.courseID+test.data.testTime+test.data.roomInfo;
      const updateRoom = await transaction.collection('test_studentForm').doc(roomID).update({
        data: {
          student: _.pull({
            _id: studentID,
            name: student.data.name
          }),
          isSigned: _.pop()
        }
      });
      const courseID = test.data.courseID;
      const updateStudentReserve = await transaction.collection('student_reserve').doc(studentID).update({
        data: {
          roomID: _.pull({
            _id: id,
            courseID: courseID,
            testTime: test.data.testTime,
            roomInfo: test.data.roomInfo
          })
        }
      });
      await transaction.commit();
      return {
        success: true,
        log: "Success!"
      }
    } else {
      await transaction.rollback();
      return {
        success: false,
        log: "Update Failed"
      }
    }
  } catch (e) {
    return {
      success: false,
      log: {
        error: e
      }
    }
  }
}