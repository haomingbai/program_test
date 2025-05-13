var CAS = require('cas');

exports.main = async (event, context) => {
  console.log(event)
  return new Promise((resolve,reject)=>{
    var cas = new CAS({
      base_url: 'https://uis.nwpu.edu.cn/cas',
      service: event.service,
      version: 2.0
    });
    var ticket = event.ticket;
    if (ticket) {
      cas.validate(ticket, function (err, status, username, obj) {
        console.log(err, status, username, obj)
        resolve({
          status: status,
          username: username,
          attributes: obj.attributes
        })
        // if (err) {
        //   // Handle the error
        //   resolve(err)
        // } else {
        //   // Log the user in
        //   resolve(username)
        // }
      });
    } else {
      resolve('no ticket')
    }
  })
};
