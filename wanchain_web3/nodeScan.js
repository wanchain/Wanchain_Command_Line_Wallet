/**
The nodeScan module,
Scan the chain block.

@module nodeScan
*/

const EventEmitter = require('events').EventEmitter;
const nodeScanOta = require('./nodeScanOta');
const SolidityCoder = require('web3/lib/solidity/coder');
let wanUtil = require('wanchain-util');
const wanchainDB = require('./wanChainOTAs');
var keythereum = require("keythereum");
let checkBurst = 500;
let scanBlockIndex = 0;
let lastBlockNumber = 0;
let getLastBlockIter = 0;
let currentScanAddress = "";

const scanIntervalNormal = 60000;
const coinContractAddr = wanUtil.contractCoinAddress;
let privKeyB;
let pubKeyA;
let self=null;
let fhs_buyCoinNote = wanUtil.sha3('buyCoinNote(string,uint256)', 256).slice(0,4).toString('hex');
function parseContractMethodPara(paraData, abi,method)
{
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


class nodeScan {
    constructor() {
        self = this;
    }
    getScanedBlock(waddr) {
        return wanchainDB.getScanedByWaddr(waddr);
    }
    setScanedBlock(waddr, scaned) {
        wanchainDB.setScanedByWaddr(waddr, scaned);
    }
    check(waddr, privB) {
        console.log('check ota by addr:', waddr);
        currentScanAddress = waddr;
        const myPub = wanUtil.recoverPubkeyFromWaddress(waddr);
        privKeyB = privB;
        pubKeyA = myPub.A;
        scanBlockIndex = self.getScanedBlock(waddr);
        self.checkOtainDb();
    }

    start(keystore, keyPassword){
        let keyBObj = {version:keystore.version, crypto:keystore.crypto2};
        let keyAObj = {version:keystore.version, crypto:keystore.crypto};
        let privKeyA;
        let privKeyB;
        try {
            privKeyA = keythereum.recover(keyPassword, keyAObj);
            privKeyB = keythereum.recover(keyPassword, keyBObj);
        }catch(error){
            console.log('wan_refundCoin', 'wrong password');
            return;
        }
        self.check(keystore.waddress, privKeyB);
    }
    compareOta(ota) {
        let otaPub = wanUtil.recoverPubkeyFromWaddress(ota._id);
        let A1 = wanUtil.generateA1(privKeyB, pubKeyA, otaPub.B);

        if (A1.toString('hex') === otaPub.A.toString('hex')) {
            ota.address = currentScanAddress;
            return true;
        }
        return false;
    }
    checkOtainDb() {
        lastBlockNumber = wanchainDB.getScanedByWaddr(null);
        console.log("scanBlockIndex,lastBlockNumber:",scanBlockIndex,lastBlockNumber);
        wanchainDB.checkOta(self.compareOta, scanBlockIndex+1, lastBlockNumber);
        wanchainDB.setScanedByWaddr(currentScanAddress, lastBlockNumber);
        console.log('done');
    }
}


module.exports = new nodeScan();
