const web3Require = global.web3Require = require('../wanchain_web3/web3_ipc');
let wanUtil = require('wanchain-util');
let fhs_SentOtatransfer = wanUtil.sha3('SentOtatransfer(address,address,bytes,uint256)', 256).toString('hex');
let contractParam = require('../wanchain_web3/contractTransParam.js');
let filterValue = {fromBlock: 0, toBlock: 84000,topics: ['0x'+fhs_SentOtatransfer]};
console.log(filterValue);
web3Require.run(function () {
    let filter = web3Require.web3_ipc.eth.filter(filterValue);
    filter.get((err, result)=>{
        for(var i = 0;i<result.length;++i)
        {
            console.log(result[i]);
            let param = contractParam.parseTopicData(result[i].data);
            console.log(param.amount.toString());
            console.log(parseInt(param._tokey));
        }
    });

})
