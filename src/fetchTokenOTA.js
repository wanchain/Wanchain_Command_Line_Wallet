let collection = require('../wanchain_web3/collection.js');
let DBArray = [{db:collection.tokenOTADB,collection: ['tokenOTABalance','TokenOTAsCollection','TokenOTAsIndexColl']},
    {db:collection.ScanDB,collection: ['tokenOTAsScanCollection']}];
const contractTransParam = require('../wanchain_web3/contractTransParam.js')
const web3Require = global.web3Require = require('../wanchain_web3/web3_ipc');
let transaction = require('../wanchain_web3/Transaction');
web3Require.useDb(DBArray);
transaction.addCurAccount();
web3Require.addSchema(web3Require.schemaAll.PasswordSchema, function (result) {

    contractTransParam.fetchTokenOTAsFromLogDb(web3Require.web3_ipc,transaction.curAddress,result.password,
        collection.tokenOTADBCollections.TokenOTAsIndexColl,collection.tokenOTADBCollections.TokenOTAsCollection,function(item)
        {
            collection.tokenOTADBCollections.insertTokenCollection(collection.tokenOTADBCollections.tokenOTABalance,
            {owner:transaction.curAddress,waddress:item.waddress,tokenAddress:item.tokenAddress,value:web3Require.web3_ipc.fromWei(item.value)});

        },function (err) {
            web3Require.exit(err);
        });
});
transaction.run();
