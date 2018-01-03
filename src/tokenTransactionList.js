let collection = require('../wanchain_web3/collection.js');
let DBArray = [{db:collection.tokenOTADB,collection: ['tokenPrivacyTransCollection']}];
let transaction = require('../wanchain_web3/Transaction');
const web3Require = global.web3Require = require('../wanchain_web3/web3_ipc');
web3Require.useDb(DBArray);
transaction.addCurAccountFunc(function (result) {
    web3Require.logger.debug(result);
    transaction.curAddress = result;
    var data = collection.tokenOTADBCollections.tokenPrivacyTransCollection.find({'address':transaction.curAddress});
    if(data)
    {
        data.forEach(function (item){
           console.log(collection.getCollectionItem(item)); 
        });
    }
    web3Require.stepNext();
});
transaction.run();

