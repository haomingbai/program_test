// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
}) // 使用当前云环境

const db = cloud.database()

// 云函数入口函数
// 目的：避免“合并大表”导致超时，这里只返回所有考场的 testInfo 列表。
// 小程序端拿到列表后逐个调用 downloadTestPartInfo 去生成/下载/打开/删除分表。
exports.main = async (event, context) => {
  try {
    const fetchAll = async (collectionName, projection = {}, pageSize = 100) => {
      const coll = db.collection(collectionName)
      const countRes = await coll.count()
      const total = countRes.total || 0
      const pages = Math.ceil(total / pageSize) || 1
      const all = []
      for (let i = 0; i < pages; i++) {
        const res = await coll.field(projection).skip(i * pageSize).limit(pageSize).get()
        if (res && Array.isArray(res.data)) all.push(...res.data)
      }
      return all
    }

    const tests = await fetchAll('test_partInfo', { courseID: true, testTime: true, roomInfo: true })
    const testInfos = (tests || [])
      .map(x => `${(x.courseID || '').trim()}${(x.testTime || '').trim()}${(x.roomInfo || '').trim()}`)
      .map(s => (typeof s === 'string' ? s.trim() : ''))
      .filter(Boolean)

    return {
      ok: true,
      count: testInfos.length,
      testInfos
    }
  } catch (e) {
    return {
      ok: false,
      err: e && e.message ? e.message : e,
      stack: e && e.stack ? e.stack : undefined,
      msg: 'Fail to get testInfos'
    }
  }
}