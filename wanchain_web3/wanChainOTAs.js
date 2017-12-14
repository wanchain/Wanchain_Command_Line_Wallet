//cranelv wanchain OTA database 2017-11-19
//const logger = require('./utils/logger');
const db = require('./collection.js').walletDB;
const scanOTA = require('./scanOTADB');
const config = require('../config');
const Web3 = require("web3");
const net = require('net');
const web3 = new Web3(new Web3.providers.IpcProvider( config.rpcIpcPath, net));
/*
OTAsCollection struct
    adress:
    OTA:
    value:
    state:
 */

exports.getScanedByWaddr = function(waddr){
    if (!waddr){
        waddr = '0x0000000000000000000000000000000000000000';
    }
    let ScanBlockIndex = db.getCollection('ScanBlockIndex');
    let Index = ScanBlockIndex.find({'_id': waddr});
    console.log("getScanedByWaddr:", Index);
    const begin = Index.length === 0 ? 0:Index[0].index;
    return begin;
}
setScanedByWaddr = function (waddr, scaned) {
    if (!waddr){
        waddr = '0x0000000000000000000000000000000000000000';
    }
    let ScanBlockIndex = db.getCollection('ScanBlockIndex');
    var found = ScanBlockIndex.findOne({'_id': waddr});
    if(found == null) {
        ScanBlockIndex.insert({
            _id: waddr,
            index: scaned,
        });
        console.log('setScanedByWaddr:', waddr, 'insert');
    } else {
        found.index = scaned;
        ScanBlockIndex.update(found);
        console.log('setScanedByWaddr:', waddr, 'update');
    }
}
exports.updateOtaStatus = function(ota) {
    let OTAsCollection = db.getCollection('OTAsCollection');
    var found = OTAsCollection.findOne({'_id': ota});
    if(found){
        found.state = 1;
        OTAsCollection.update(found);
    }
}
exports.insertOtabyWaddr = function(waddr, ota, value, state,timeStamp,from,blockNumber) {
    let OTAsCollection = db.getCollection('OTAsCollection');
    let Key = waddr.toLowerCase();
    try {
        OTAsCollection.insert({'address': Key, '_id':ota, 'value':value, 'state':state, 'timeStamp':timeStamp,'otaFrom':from, 'blockNumber':blockNumber});
    }catch(err){
        console.log("insertOtabyWaddr:", err);
    }
}
function getCollectionItem(item) {
    var newItem = {};
    for (var key in item) {
        if(key !== 'meta' && key !== '$loki')
        {
            newItem[key] = item[key];
        }
    }
    return newItem;
};
exports.checkOta = function(cb,currentScanAddress, blockFrom) {
    let OTAsCollection = db.getCollection('OTAsCollection');
    let lastBlockNumber = scanOTA.getScanedIndex();
    let where = {};
    where.blockNumber = {'$gte': blockFrom, '$lte':lastBlockNumber};
    where.state = {'$eq': 0};
    let otaSet = scanOTA.requireOTAs(where);
    console.log('checkOta otaSet length:', otaSet.length);
    otaSet.forEach((ota) => {
       let changed = cb(ota);
       if (changed) {
           var Item = getCollectionItem(ota);
           Item.state = '0';
           var found = OTAsCollection.findOne({'_id': Item._id});
           console.log(Item._id);
           if(!found)
           {
               OTAsCollection.insert(Item);
           }
           else
           {
               OTAsCollection.update(Item);
           }
           console.log("find new OTA:" + Item._id + '  ,value: ' + web3.fromWei(Item.value));
       }
    });
    setScanedByWaddr(currentScanAddress, lastBlockNumber);
}


exports.requireOTAsFromCollection = (where) =>
{
    var OTAsCollection = db.getCollection('OTAsCollection');
    return OTAsCollection.find(where);
}
exports.firstNewAccount = (newAccount) =>
{
    var accountCollection = db.getCollection('firstNewAccount');
    var found = accountCollection.findOne({'address': newAccount.address});
    if(found == null)
    {
        accountCollection.insert({'address': newAccount.address, 'name': newAccount.name});
    }
}
exports.requireAccountName = (address) =>
{
    console.log('requireAccountName:' + address);
    var accountCollection = db.getCollection('firstNewAccount');
    return accountCollection.find({'address': address});
}
exports.setScanedByWaddr = setScanedByWaddr;