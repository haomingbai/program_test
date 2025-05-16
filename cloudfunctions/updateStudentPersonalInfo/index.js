// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
}) // 使用当前云环境

const db = cloud.database({
  throwOnNotFound: false,
}) // 关闭无条目时异常

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const identityType = event.identityType;
  const studentID = event.studentID;
  const studentName = event.name;
  const school = event.school;

  try {
    const trans = await db.startTransaction();
    const oriItem = await trans.collection("student_reserve").doc(studentID).get();
    
    if (oriItem.data) {
      res = await trans.collection("student_reserve").doc(studentID).update({
        data: {
          identityType: identityType,
          school: school,
          name: studentName,
        }
      });
    } else {
      res = await trans.collection("student_reserve").add({
        data: {
          _id: studentID,
          name: studentName,
          roomID: [],
          selectedCourses: [],
          school: school,
          password: "",
          classID: "",
          identityType: identityType
        }
      });
    }

    trans.commit();
    return {
      success: true,
      res: {
        identityType: identityType,
        name: studentName,
        school: school,
        studentID: studentID
      }
    };
  } catch (error) {
    return {
      success: false,
      err: error
    };
  }
}