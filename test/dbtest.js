const Db = require('../wanchain_web3/db.js');

Db.init().then(function () {
    let transCollection = Db.getCollection('transaction','transHash');
    insertTransaction(transCollection,'0x9059faf60ed06b98a8159417c152ad915b4b31180a270231626c01c9f9bcfb91',
        '0x0036805b6846f26ac35f2a7d7eda4a2a58f08e8e',
        '0x42dcf444e8b1a1c52d4e0ec7de964d9b0fe04822',
        100000000,'');
}).catch((err) => {
    console.log(err);
});
function insertTransaction(transCollection,transhash,from,to,value,p)
{
    var found = transCollection.findOne({'transHash': transhash});
    if(found == null) {

        transCollection.insert({
            transHash: transhash,
            from: from,
            to:to,
            value:value,
            time:getNowFormatDate(),
            p:p
        });
    } else {
        console.log(transhash + 'is already existed!');
    }
};
function getNowFormatDate() {
    var date = new Date();
    var seperator1 = "-";
    var seperator2 = ":";
    var month = date.getMonth() + 1;
    var strDate = date.getDate();
    if (month >= 1 && month <= 9) {
        month = "0" + month;
    }
    if (strDate >= 0 && strDate <= 9) {
        strDate = "0" + strDate;
    }
    var currentdate = date.getFullYear() + seperator1 + month + seperator1 + strDate
        + " " + date.getHours() + seperator2 + date.getMinutes()
        + seperator2 + date.getSeconds();
    return currentdate;
};