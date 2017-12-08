/* license */

const config = require('../config');

const log = require('./utils/logger').create('nodeScanOta');
const SolidityCoder = require('web3/lib/solidity/coder');
let wanUtil = require('wanchain-util');
const wanchainDB = require('./wanChainOTAs');
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


class nodeScanOta  {
    constructor() {
        self = this;
    }
    getScanedBlock() {
        return wanchainDB.getScanedByWaddr(null);
    }
    setScanedBlock(scaned) {
        wanchainDB.setScanedByWaddr(null, scaned);
    }

    scanBlock() {
        web3.eth.getBlockNumber((err, n)=>{
            if(err){
                console.log("getBlockNumber error:", err);
                scanTimer = setTimeout(self.scanBlock,10000);
            }
            lastBlockNumber = n;
            let count = 0;
            console.log("scanBlockIndex, lastBlockNumber :",scanBlockIndex, lastBlockNumber);
            while(scanBlockIndex < lastBlockNumber && count < burst) {
                let paramArrary = ['0x'+scanBlockIndex.toString(16), true];
                web3.eth.getBlock('0x'+scanBlockIndex.toString(16), true, (err, block)=>{
                    if(err){
                        console.log("getBlock Error:", err);
                        scanTimer = setTimeout(self.scanBlock,10000);
                    }else {
                        block.transactions.forEach((tx) => {
                            if (tx.to == coinContractAddr) {
                                let cmd = tx.input.slice(2, 10).toString('hex');
                                if (cmd != fhs_buyCoinNote) {
                                    return;
                                }
                                let inputPara = tx.input.slice(10);
                                let paras = parseContractMethodPara(inputPara, wanUtil.coinSCAbi, 'buyCoinNote');
                                wanchainDB.insertOtabyWaddr('', paras.OtaAddr, tx.value, 0, block.timeStamp, tx.from, scanBlockIndex);
                                console.log("new ota found:", paras.OtaAddr, scanBlockIndex);
                            }
                        });
                    }
                });
                count += 1;
                scanBlockIndex += 1;
            }
            wanchainDB.setScanedByWaddr(null, scanBlockIndex);
            if(count === burst){
                scanTimer = setTimeout(self.scanBlock,10);
            }else {
                scanTimer = setTimeout(self.scanBlock,10000);
            }
        });
    }
    start() {
        scanBlockIndex = this.getScanedBlock();
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


module.exports = new nodeScanOta();

