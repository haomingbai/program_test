// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

const db = cloud.database({
  throwOnNotFound: false,
});

// 云函数入口函数

//传入考场信息“课程+时间+考场”和学号
exports.main = async (event, context) => {
  const roomID = event.roomID.trim();
  const studentID = event.studentID.trim();
  try {
    const transaction = await db.startTransaction();

    //const content = await transaction.collection('test_studentForm').doc(roomID).get();
    const content = await transaction.collection('test_studentForm').doc(roomID.trim()).get().then();
    if(content.data) {
      const index = content.data.student.findIndex(item => item._id == studentID);
      if(index != -1) {
        const update = await transaction.collection('test_studentForm').doc(roomID.trim()).update({
          data: {
            ['student.${index}.isSigned']: true 
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
          log: "No Student Found!"
        }
      }
    } else {
      await transaction.rollback();
      return {
        success: false,
        log: "No Form Found!"
      }
    }

  } catch (e) {
    return {
      success: false,
      log: e
    }
  }
}