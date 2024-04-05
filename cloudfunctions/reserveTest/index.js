// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

const db = cloud.database({
  // 该参数从 wx-server-sdk 1.7.0 开始支持，默认为 true，指定 false 后可使得 doc.get 在找不到记录时不抛出异常。微信官方文档加了这一段，我也不知道为什么。
  throwOnNotFound: false,
});

const _ = db.command;

// 云函数入口函数
exports.main = async (event,context) => {


  const studentID = event.context;
  
  try {

    const transaction = await db.startTransaction();
    const tryRoomInfo = event.event.courseID + event.event.testTime + event.event.roomInfo;

    const item = await transaction.collection('test_studentForm').doc(tryRoomInfo).get();
    const student = await transaction.collection('student_reserve').doc(studentID).get();
    if(item.data.roomVolume - item.data.student.length > 0 && student) {
      const updateStudentForm = await transaction.collection('test_studentForm').doc(tryRoomInfo).update({
        data: {
          student: _.push(student.data),
          isSigned: _.push(0)
        }
      })
      const updateStudentReserve = await transaction.collection('student_reserve').doc(studentID).update({
        data: {
          roomID: _.push(event.event)
        }
      })

      await transaction.commit();

      return {
        success: true,
        log: 'Successfully enrolled in the exam!'
      };

    } else {
      await transaction.rollback();
      return {
        success: false,
        log: 'Student is not found (low possibility) or the volumn is full!'
      }
    }

    

  } catch (e) {
    return {
      success: false,
      log: e
    }
  }

}