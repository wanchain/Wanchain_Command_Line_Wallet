/* license */

const config = require('../config');

const log = require('./utils/logger').create('nodeScanOta');
const SolidityCoder = require('web3/lib/solidity/coder');
let wanUtil = require('wanchain-util');
const wanchainDB = require('./scanOTADB');
const Web3 = require("web3");
const net = require('net');
const web3 = new Web3(new Web3.providers.IpcProvider( config.rpcIpcPath, net));

let scanBlockIndex = 0;
let lastBlockNumber = 0;
let getLastBlockIter = 0;
let scanTimer = 0;
let currentScanAddress = "";
let burst = 100;
const scanIntervalNormal = 60000;
const coinContractAddr = wanUtil.contractCoinAddress;
let self;
let fhs_buyCoinNote = wanUtil.sha3('buyCoinNote(string,uint256)', 256).slice(0,4).toString('hex');
function parseContractMethodPara(paraData, abi, method) {
    var dict = {};
    var inputs = [];
    let i=0;
    for(i=abi.length-1; i>=0; i--){
        if(abi[i].name == method){
            inputs = abi[i].inputs;
            break;
        }
    }
    if(i >= 0){
        var format = [];
        for(let j=0; j<inputs.length; j++){
            format.push(inputs[j].type);
        }
        let paras = SolidityCoder.decodeParams(format,paraData);
        for(let j=0; j<inputs.length && j<paras.length; j++){
            dict[inputs[j].name] = paras[j];
        }
    }

    return dict;
}


class nodeScanTrans  {
    constructor(address) {
        self = this;
        this.address = address;
        this.balance = 0;
    }
    getScanedBlock() {
        return wanchainDB.getScanedIndex();
    }
    setScanedBlock(scaned) {
//        wanchainDB.setScanedIndex(scaned);
    }

    scanBlock() {
        web3.eth.getBlockNumber((err, n)=>{
            if(err){
                console.log("getBlockNumber error:", err);
                scanTimer = setTimeout(self.scanBlock,10000);
            }
            lastBlockNumber = n;
            let count = 0;
//            console.log("scanBlockIndex, lastBlockNumber :",scanBlockIndex, lastBlockNumber);
            while(scanBlockIndex < lastBlockNumber && count < burst) {
                let paramArrary = ['0x'+scanBlockIndex.toString(16), true];
                web3.eth.getBlock(scanBlockIndex, true, (err, block)=>{
                    if(err){
                        console.log("getBlock Error:", err);
                        scanTimer = setTimeout(self.scanBlock,10000);
                    }else {
                        block.transactions.forEach((tx) => {
                            if(tx.from == self.address)
                            {
                                var value = web3.fromWei(tx.value).toString();
                                console.log('hash: ' + tx.hash + ' to:'+tx.to+' ;value: '+value );
                                self.balance -= parseFloat(value);
                                console.log('balance: ' + self.balance);
                            }
                            else if(tx.to == self.address)
                            {
                                var value = web3.fromWei(tx.value).toString();
                                console.log('hash: ' + tx.hash + ' from:'+tx.from+' ;value: '+value);
                                //console.log(tx);
                                self.balance += parseFloat(value);
                                console.log('balance: ' + self.balance);
                            }

                        });
                    }
                });
                count += 1;
                scanBlockIndex += 1;
                if(scanBlockIndex >= lastBlockNumber)
                {
                    web3Require.exit('scan done');
                }
            }
//            wanchainDB.setScanedIndex( scanBlockIndex);
            if(count === burst){
                scanTimer = setTimeout(self.scanBlock,10);
            }else {
                scanTimer = setTimeout(self.scanBlock,10000);
            }
        });
    }
    start() {
        scanBlockIndex = 0;
        this.scanBlock();
    }
    stop() {
        if (scanTimer !== 0) {
            clearTimeout(scanTimer);
            scanTimer = 0;
        }
    }
    restart( ) {
        self.stop();
        self.start();
    }
}


module.exports = new nodeScanTrans('0x468a974f70af1feda86d02c45149f325c5bef446');

