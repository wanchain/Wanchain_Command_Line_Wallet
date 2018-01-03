/* license */

const config = require('../config');
let contractParam = require('./contractTransParam.js')

const tokenScanOTADB = require('./collection').tokenScanOTADB;
const Web3 = require("web3");
const net = require('net');
const web3 = new Web3(new Web3.providers.IpcProvider( config.rpcIpcPath, net));

let ASyncLoopStack = require('./ASyncLoopStack.js');

class tokenOTAScan{
    constructor(msecond,scanNum) {
        this.loop = new ASyncLoopStack(scanNum,msecond);
        this.loop.range = [0,70000];
        this.loop.param = this;
        this.loop.EachFunc = this.scanBlock;
        this.loop.EndFunc = this.stop;
    }
    start() {
        console.time();
        this.loop.run();
    }
    runIdle()
    {
        this.stop();
        this.stepIdleEvent();
    }
    stepIdleEvent() {
        let self = this;
        self.timeInv = setInterval(function () {
            if(self.curScan == 0 && self.scanBlockIndex == self.lastBlockNumber)
            {
                web3.eth.getBlockNumber((err, n)=> {
                    if (!err) {
                        self.lastBlockNumber = n;
                    }
                });
            }
            else if (self.scanBlockIndex != self.lastBlockNumber && self.curScan < self.ScanNum) {
                ++self.curScan;
                self.emit('scan',self);
            }
        }, self.msecond*10000);
    }
    stop() {
        console.timeEnd();
//        if (this.timeInv !== 0) {
//            clearInterval(this.timeInv);
//            this.timeInv = 0;
//        }
    }
    stepEvent()
    {
        let self = this;
        self.timeInv = setInterval(function(){
            if(self.curScan<self.ScanNum)
            {
                ++self.curScan;
                self.emit('scan',self);
            }
        },self.msecond);
    }
    scanBlock(self,item,index)
    {
        web3.eth.getBlock(index, true, (err, block)=>{
            if(err){
                console.log("getBlock Error:", err);
                self.loop.stepNext();
            }else {
                for(var i=0;i<block.transactions.length;i++)
                {
                    var tx = block.transactions[i];
                    if(contractParam.isTokenOTA(tx))
                    {
                        let param = contractParam.parseContractTokenOTA(tx.input);
                        if(param)
                        {
                            let input = param.CxtCallParams;
                            if(contractParam.isOTATransfer(input))
                            {
                                let param = contractParam.parseContractOTATransfer(input);
                                if(param){
                                    insertOtas(param._to,param._toKey, tx.to,param._value,
                                        tx.from,block.timeStamp, block.number-1,tx.hash);
                                }
                            }
                        }
                    }
                }
                self.loop.stepNext();
            }
        });
    }

    //message[scan]
    scan(self)
    {
        if(self.scanBlockIndex < self.lastBlockNumber) {
            ++self.scanBlockIndex;
            web3.eth.getBlock(self.scanBlockIndex, true, (err, block)=>{
                if(err){
                    console.log("getBlock Error:", err);
                    self.emit('scanEnd',self);
                }else {
                    for(var i=0;i<block.transactions.length;i++)
                    {
                        var tx = block.transactions[i];
                        if(contractParam.isTokenOTA(tx))
                        {
                            let param = contractParam.parseContractTokenOTA(tx.input);
                            if(param)
                            {
                                let input = param.CxtCallParams;
                                if(contractParam.isOTATransfer(input))
                                {
                                    let param = contractParam.parseContractOTATransfer(input);
                                    if(param){
//                                        insertOtas(param._to,param._toKey, tx.to,param._value,
//                                            tx.from,block.timeStamp, block.number-1,tx.hash);
                                    }
                                }
                            }
                        }
                    }
                }
                self.emit('scanEnd',self);
            });
        }

    }
    //message[scanEnd]
    scanEnd(self)
    {
        --self.curScan;
        if((self.scanBlockIndex % 1000) == 0)
        {
            self.emit('saveScanBlock',self);
        }
        if(self.curScan == 0 && self.scanBlockIndex == self.lastBlockNumber)
        {
            self.runIdle();
        }
    }
    //message[saveScanBlock]
    saveScanBlock(self)
    {
        setScanedIndex(self.scanBlockIndex);
    }
    getScanedBlock() {
        this.scanBlockIndex = getScanedIndex();
    }
    requireOTAs(where)
    {
        let OTAsCollection = tokenScanOTADB.getCollection('OTAsScan','address');;
        return OTAsCollection.find(where);
    }


}
let waddr = '0x0';
function ScanBlockCollection() {
    return tokenScanOTADB.getCollection('ScanIndex');
}
function getScanedIndex(){
    let Index = ScanBlockCollection().find({'_id': waddr});
    console.log("getScanedByWaddr:", Index);
    const begin = Index.length === 0 ? 0:Index[0].index;
    return begin;
}
function setScanedIndex(scaned) {
    let collection1 = ScanBlockCollection();
    var found = collection1.findOne({'_id': waddr});
    if(found == null) {
        collection1.insert({
            _id: waddr,
            index: scaned,
        });
    } else {
        found.index = scaned;
        collection1.update(found);
    }
}
function insertOtas( adress,waddress,tokenAddress,value,fromAddress,timeStamp,blockNumber,txHash) {
    let OTAsCollection = tokenScanOTADB.getCollection('OTAsScan','address');
    try {
        let value1 = value.toString();
        OTAsCollection.insert({ 'address':adress,'waddress':waddress,
        'tokenAddress':tokenAddress,'value':value1,'from':fromAddress,
        'timeStamp':timeStamp,'blockNumber':blockNumber,'txHash': txHash});
    }catch(err){
        console.log("insertOtabyWaddr:", err);
    }
}
module.exports = new tokenOTAScan(3);

