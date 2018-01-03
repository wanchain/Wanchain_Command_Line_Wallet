let collection = require('../wanchain_web3/collection.js');
let DBArray = [{db:collection.walletDB,collection: ['OTAsCollection','OTAsIndexColl']},
    {db:collection.ScanDB,collection: ['OTAsScanCollection']}];
const contractTransParam = require('../wanchain_web3/contractTransParam.js')
const web3Require = global.web3Require = require('../wanchain_web3/web3_ipc');
let transaction = require('../wanchain_web3/Transaction');
web3Require.useDb(DBArray);
transaction.addCurAccount();
web3Require.addSchema(web3Require.schemaAll.PasswordSchema, function (result) {

    contractTransParam.fetchOTAs(transaction.curAddress,result.password,collection.ScanDBCollections.OTAsScanCollection,
        collection.WalletDBCollections.OTAsIndexColl,collection.WalletDBCollections.OTAsCollection);
    web3Require.exit();
});
transaction.run();
