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
    const content = await transaction.collection('test_studentForm').doc(roomID.trim()).get();


    if(content){
      let student = content.data.student;
      let index = -1;
      for(const location in student) {
        if(student[location]._id == studentID) {
          index = location;
          break;
        }
      }


      if(index != -1) {
        const update = await transaction.collection('test_studentForm').doc(roomID).update({
          data: {
            ['isSigned.'+[index]]: 1,
          }
        })

        await transaction.commit();

        return {
          success: true,
          log: 'Successfully signed in'
        }

      } else {
        await transaction.rollback();
        return {
          success: false,
          log: 'No Student whose id is ' + studentID
        }
      }

    } else {
      await transaction.rollback();
      return {
        success: false,
        log: "No Form Named " + roomID
      }
    }


  } catch (e) {
    return {
      success: false,
      log: e
    }
  }
}