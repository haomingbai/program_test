// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 云函数入口函数
exports.main = async (event, context) => {
  let page = event.page;
  let parameter = event.parameter;
  try {
    const result = await cloud.openapi.wxacode.getUnlimited({
        "page": page+parameter,
        "scene": 'a=1',
        "checkPath": false,
        "envVersion": 'trial'
      })
    return result
  } catch (err) {
    return err
  }
}