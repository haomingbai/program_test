const db = wx.cloud.database();

function getDatabase_user(databaseName, openid) {
  return db.collection(databaseName).where({ user_openid: openid }).get().then(res => {
    console.log(res);
    return res;
  }).catch(err => {
    console.error('请求失败', err);
    wx.showToast({
      title: '出现故障',
      icon: 'error'
    });
  });
}

function getDatabase_allany(databaseName) {
  return db.collection(databaseName).get().then(res => {
    console.log(res);
    return res;
  }).catch(err => {
    console.error('请求失败', err);
    wx.showToast({
      title: '出现故障',
      icon: 'error'
    });
  });
}


module.exports = {
  getDatabase_user : getDatabase_user,
  getDatabase_allany:getDatabase_allany
}
