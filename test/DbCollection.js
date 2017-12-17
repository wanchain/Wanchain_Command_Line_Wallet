var optimist = require('optimist')
    .string(['password', 'repeatPass', 'address' ,'waddress', 'tokenAddress']);
const Db = require('../wanchain_web3/collection.js').walletDB;
//const scanDb = require('./collection.js').scanOTADB;
const web3Require = global.web3Require = require('../wanchain_web3/web3_ipc');
Db.init().then(function () {
    let transCollection = Db.getCollection('transaction','transHash');
    let OTAsCollection = Db.getCollection('OTAsCollection');
    let tokenCollection = Db.getCollection('tokenCollection');
    switch(optimist.argv.type)
    {
        case 'transList' :
            var data = transCollection.find({'from': optimist.argv.address});
            if(data)
            {
                data.forEach(function (item, index) {
                    console.log(getCollectionItem(item));
                });
            }
            break;
        case 'OTAList':
            let wAddress = web3Require.getWAddress(optimist.argv.address);
            var data = OTAsCollection.find({'from': wAddress});
            if(data)
            {
                data.forEach(function (item, index) {
                    console.log(getCollectionItem(item));
                });
            }
            break;
        case 'token':
            var data = tokenCollection.find({'from': optimist.argv.address});
            if(data)
            {
                data.forEach(function (item, index) {
                    console.log(getCollectionItem(item));
                });
            }
            break;
    }
    exit1();
//    transCollection.find()
})
function exit1() {
    if(Db)
    {
        Db.close().then(function () {
            process.exit();
        });
    }
    else
    {
        process.exit();
    }

}
function getCollectionItem(item) {
    var newItem = {};
    for (var key in item) {
        if(key !== 'meta' && key !== '$loki')
        {
            newItem[key] = item[key];
        }
    }
    return newItem;
};