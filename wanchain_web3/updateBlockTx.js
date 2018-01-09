let ASyncLoopStack = require('./ASyncLoopStack.js');
let functionStack = require('./functionStack.js');
let updateTransaction = {
    web3 : null,
    collection : null,
    loop : new ASyncLoopStack(2),
    getTransactionArray()
    {
        let self = this;
        this.web3.eth.getBlockNumber((err,num)=> {
            if(!err)
            {
                this.loop.Array = this.collection.where(function (obj) {
                    return (!obj.blockNumber) || (obj.blockNumber > num - 30);
                });
            }
        });
    },
    setEachfunc()
    {
        this.loop.EachFunc = function(param,item,index)
        {
            if (item.transHash && item.transHash.length) {
                web3Require.web3_ipc.eth.getTransactionReceipt(item.transHash, function (err, result) {
                    if (!err) {
                        if (result && result.blockNumber > 0) {
                            if (result.status == "0x1") {
                                item.state = 1;
                            }
                            this.collection.update(item);
                        }
                    }
                    curLoop.stepNext();
                });
            }
            else
            {
                curLoop.stepNext();
            }
        }
    }
}
class updateBlockTx
{
    constructor(web3,collection) {
        this.web3 = web3;
        this.collection = collection;
        this.loop = new ASyncLoopStack(2);
        this.functionStack = new functionStack();
    }
    getCollectionFind(whereFilter)
    {
        this.loop.Array = this.collection.where(whereFilter);
    }
    initArray(){}
    update()
    {
        this.initArray();
    }
}
module.exports = class updateBlockTx
{
    constructor(web3,collection) {
        this.web3 = web3;
        this.collection = collection;
        this.loop = new ASyncLoopStack(2);
    }
    getCollectionFind(whereFilter)
    {
        this.collection.where(whereFilter);
    }
    updateItem(item)
    {
        this.collection.update(item);
    }
};

