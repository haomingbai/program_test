// 云函数入口文件
// 说明：此 getInfo 云函数仅供你本人内部维护使用（不对客户端开放）。
// 背景：你已经完成了 test_partInfo / test_studentForm 的改场次操作。
// 需求：补充更新 student_reserve 集合中 roomID 列表里的 testTime。
//  - student_reserve.roomID: List
//  - roomID 每个元素包含：{ _id(随机串), courseID, testTime, roomInfo }
//  - 本次只修改元素的 testTime，保留元素 _id 不变。

const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

function escapeRegExp(str) {
  // 把普通字符串转成安全的正则字面量（用于 db.RegExp）
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

async function fetchAllByWhere(db, collectionName, where) {
  // CloudBase 单次 get 有数量限制，这里用 count + 分页拉取所有匹配文档
  const MAX_LIMIT = 100
  const total = (await db.collection(collectionName).where(where).count()).total
  const tasks = []
  for (let skip = 0; skip < total; skip += MAX_LIMIT) {
    tasks.push(
      db
        .collection(collectionName)
        .where(where)
        .skip(skip)
        .limit(MAX_LIMIT)
        .get()
    )
  }
  const pages = await Promise.all(tasks)
  return pages.flatMap((p) => p.data)
}

async function fetchAllDocs(db, collectionName) {
  // 全表扫描（内部维护用）：count + 分页 get
  const MAX_LIMIT = 100
  const total = (await db.collection(collectionName).count()).total
  const pages = []
  for (let skip = 0; skip < total; skip += MAX_LIMIT) {
    // 串行拉取，避免一次性并发过高
    // eslint-disable-next-line no-await-in-loop
    const res = await db.collection(collectionName).skip(skip).limit(MAX_LIMIT).get()
    pages.push(...res.data)
  }
  return pages
}

// 云函数入口函数
exports.main = async (event, context) => {
  const db = cloud.database()

  // ====== 可按需修改的“手动开关”参数（默认按你的需求写死） ======
  // 你说的是：“系统里 14号10:25 那一场改成 19:00-20:30”。这里按 2026年1月14日 处理。
  const TARGET_DATE_PREFIX = '2026年1月14日'
  const TARGET_START_TIME = '10:25'
  const NEW_TIME_RANGE = '19:00-20:30'

  // 如果你之后想临时改别的场次，也可以从 event 覆盖上面的默认值：
  // event.targetDatePrefix / event.targetStartTime / event.newTimeRange
  const targetDatePrefix = event?.targetDatePrefix || TARGET_DATE_PREFIX
  const targetStartTime = event?.targetStartTime || TARGET_START_TIME
  const newTimeRange = event?.newTimeRange || NEW_TIME_RANGE

  // 我们匹配 testTime 形如：2026年1月14日10:25-11:25（后半段任意），只要“以 date+start 开头”就算目标场次
  const targetPrefix = `${targetDatePrefix}${targetStartTime}`
  const testTimeWhere = {
    testTime: db.RegExp({
      regexp: `^${escapeRegExp(targetPrefix)}`,
      options: '',
    }),
  }

  const summary = {
    targetPrefix,
    newTimeRange,
    scannedReserveCount: 0,
    matchedReserveDocCount: 0,
    updatedReserveDocCount: 0,
    updatedRoomItemCount: 0,
    warnings: [],
    details: [],
  }

  try {
    // 仅处理 student_reserve：全表扫描并按需更新 roomID 列表
    const reserves = await fetchAllDocs(db, 'student_reserve')
    summary.scannedReserveCount = reserves.length

    const newTestTime = `${targetDatePrefix}${newTimeRange}`

    for (const reserve of reserves) {
      const reserveId = reserve._id
      const roomIDList = reserve.roomID

      if (!Array.isArray(roomIDList) || roomIDList.length === 0) {
        continue
      }

      let changed = false
      let changedItems = 0
      const newRoomIDList = roomIDList.map((item) => {
        if (!item || typeof item !== 'object') return item
        const oldItemTestTime = item.testTime
        if (typeof oldItemTestTime !== 'string') return item
        if (!oldItemTestTime.startsWith(targetPrefix)) return item

        changed = true
        changedItems += 1
        return {
          ...item,
          testTime: newTestTime,
        }
      })

      if (!changed) {
        continue
      }

      summary.matchedReserveDocCount += 1
      summary.updatedRoomItemCount += changedItems

      // 这里直接 update roomID 数组即可（不会改 doc 的 _id，也不会改元素的随机 _id）
      // eslint-disable-next-line no-await-in-loop
      await db.collection('student_reserve').doc(reserveId).update({
        data: { roomID: newRoomIDList },
      })
      summary.updatedReserveDocCount += 1

      summary.details.push({
        reserveId,
        changedItems,
      })
    }

    return summary
  } catch (err) {
    // 返回足够信息便于你在控制台定位
    console.error('[getInfo] update student_reserve.roomID.testTime failed:', err)
    return {
      ok: false,
      message: '执行失败，详见云函数日志。',
      errorMessage: err?.message || String(err),
      summary,
    }
  }
}
