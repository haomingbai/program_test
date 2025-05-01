// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

const db = cloud.database({
  throwOnNotFound: false,
})

const _ = db.command;

// 云函数入口函数
exports.main = async (event, context) => {
  const name = event.name;
  const password = event.password;
  const _id = event.studentID;
  let result = {
    name: name,
    password: password,
    _id: _id,
    state: ""
  };
  //return event;
  const probe = await db.collection('student_reserve').doc(_id).get();
  if(probe.data) {
    await db.collection('student_reserve').doc(_id).update({
      data: {
        selectedCourses: _.addToSet('程序技能大赛')
      }
    })
    result.state = "已经报名"
  } else {
    await db.collection('student_reserve').add({
      data: {
        _id: _id,
        name: name,
        password: password,
        roomID: [],
        selectedCourses: ['程序技能大赛']
      }
    })
    result.state = "报名成功"
  }

  return result;
  
}