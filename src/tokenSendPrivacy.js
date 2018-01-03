
let transaction = require('../wanchain_web3/Transaction');
const web3Require = global.web3Require = require('../wanchain_web3/web3_ipc');
const wanToken = require('../wanchain_web3/wanToken.js');
let collection = require('../wanchain_web3/collection.js');
let DBArray = [{db:collection.walletDB,collection: ['transCollection']},
    {db:collection.tokenOTADB,collection: ['tokenOTABalance','tokenStampCollection','tokenPrivacyTransCollection']}];
web3Require.useDb(DBArray);
transaction.addCurAccount();
transaction.addContractBalanceList(function (self) {
    wanToken.getTokenPrivacyBalance(web3Require.web3_ipc,self.tokenAddress,self.privacyToken.waddress,function (err,result) {
        if (!err) {
            var value = parseFloat(web3Require.web3_ipc.fromWei(result));
            console.log('token balance: ' + value);
            var find = collection.tokenOTADBCollections.tokenOTABalance.findOne({
                'owner': self.curAddress,
                'waddress': self.privacyToken.waddress, 'tokenAddress': self.tokenAddress
            });
            if (find && value != find.value) {
                if (value > 0) {
                    find.value = value;
                    collection.tokenOTADBCollections.tokenOTABalance.update(find);
                }
                else {
                    collection.tokenOTADBCollections.tokenOTABalance.remove(find);
                    web3Require.exit('This token balance have no coin');
                }
            }
            web3Require.stepNext();
        }
    });
});
transaction.addToWAddress();
transaction.addTransAmount();
transaction.addStampFee();
transaction.addSend();
transaction.sendTokenPrivacyContractStack();
transaction.run();