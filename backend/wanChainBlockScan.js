/* license */
const config = require('../config');
//let contractParam = require('./contractTransParam.js')

const WanchainScanDB = require('../wanchain_web3/collection').WanchainScanDB;
const Web3 = require("web3");
const net = require('net');
const web3 = new Web3(new Web3.providers.IpcProvider( config.rpcIpcPath, net));
//let ASyncLoopStack = require('./ASyncLoopStack.js');
var web3Require = require('../wanchain_web3/web3_ipc');
let collection = require('../wanchain_web3/collection.js');
let DBArray = [{db:collection.ScanDB,collection: ['OTAsScanCollection','tokenOTAsScanCollection','ScanIndexCollection']}];
web3Require.useDb(DBArray);

let beginBlock = 0;
let backBlock = 0;
let blockNumber = 0;
let waitTime = 0;
//send
function sacanBlock(param,child) {
    while(!param.message && param.begin<param.End && param.blockNum<2)
    {
        ++param.blockNum;
        let i = param.begin;
        if((param.begin%10000)!=0 && (param.begin%1000) == 0)
            setScanedIndex(param.begin);
        ++param.begin;
        web3.eth.getBlock(i, true, (err, block)=>{
            if(!err && block.transactions.length){
                if(param.idle)
                {
                    child.send({tx:block.transactions,time:block.timestamp,number:block.number-1});
                    param.idle = false;
                }
                else
                {
                    param.message = {tx:block.transactions,time:block.timestamp,number:block.number-1};
                }
            }
            --param.blockNum;
        });
    }
}

function childMessage(msg,param,child) {
//    console.log(msg);
    if(param.message)
    {
        child.send(param.message);
        param.message = null;
    }
    else
    {
        param.idle = true;
    }
    var i =0;
    for(i=0;i<msg.token.length;++i)
    {
        var item = msg.token[i];
        insertTokenOtas(item[0],item[1],item[2],item[3],item[4],item[5],item[6],item[7]);
    }
    for(i=0;i<msg.privacy.length;++i)
    {
        var item = msg.privacy[i];
        insertOtas(item[0],item[1],item[2],item[3],item[4],item[5]);
    }
}

let FirstScan = {
    type: 'first',
    begin : 0,
    End : 0,
    message : null,
    idle : true,
    blockNum: 0,
}
var child_process = require('child_process');
var child_first = child_process.fork('./blockScanFirst.js');
//message back
child_first.on('message', function(msg) {
//    console.log(msg);
    childMessage(msg,FirstScan,child_first);
});


let LastScan = {
    type: 'last',
    begin : 0,
    End : 0,
    message : null,
    idle : true,
    blockNum: 0,
}
var child_last = child_process.fork('./blockScanFirst.js');
child_last.on('message', function(msg) {
    childMessage(msg,LastScan,child_last);
});


let BackScan = {
    type: 'back',
    begin : 0,
    End : 0,
    message : null,
    idle : true,
    blockNum: 0,
}
var child_back = child_process.fork('./blockScanFirst.js');
child_back.on('message', function(msg) {
    childMessage(msg,BackScan,child_back);
});

function scanBlockGroup(param,child,begin,end) {
    var nBegin = getScanedIndex(begin);
    param.begin = nBegin+1;
    param.End = end;
}
function globalScan() {
    if(child_first)
    {
        if(FirstScan.begin<FirstScan.End)
        {
            sacanBlock(FirstScan,child_first);
        }
        else
        {
            setScanedIndex(FirstScan.begin-1);
            if(beginBlock<backBlock-1)
            {
                beginBlock++;
                scanBlockGroup(FirstScan,child_first,beginBlock*10000,(beginBlock+1)*10000);
                sacanBlock(FirstScan,child_first);
            }
            else
            {
                //kill
                child_first.kill();
                child_first = null;
            }
        }
    }
    if(child_back)
    {
        if(BackScan.begin<BackScan.End)
        {
            sacanBlock(BackScan,child_back);
        }
        else
        {
            setScanedIndex(BackScan.begin-1);
            if(beginBlock<backBlock-1)
            {
                backBlock--;
                scanBlockGroup(BackScan,child_back,backBlock*10000,(backBlock+1)*10000);
                sacanBlock(BackScan,child_back);
            }
            else
            {
                //kill
                child_back.kill;
                child_back = null;
            }
        }
    }
    if(LastScan.begin<LastScan.End)
    {
        sacanBlock(LastScan,child_last);
    }
    else
    {
        if(waitTime == 0)
        {
            setScanedIndex(LastScan.begin-1);
            waitTime++;
        }
        else if(waitTime<10000)
        {
            waitTime++;
        }
        else {
            web3.eth.getBlockNumber((err, n) => {
                if (!err) {
                    console.log('getBlockNumber' + n);
                    blockNumber = n;
                    LastScan.End = blockNumber;
                    waitTime = 0;
                }
            });
        }
        //last block
    }
}
let TokenIndex = 1;
let OTAIndex = 1;
web3Require.initDatabase(function () {

    var result = collection.ScanDBCollections.tokenOTAsScanCollection.maxRecord('index');
    if(result && result.value)
    {
        TokenIndex = result.value + 1;
    }
    result = collection.ScanDBCollections.OTAsScanCollection.maxRecord('index');
    if(result && result.value)
    {
        OTAIndex = result.value + 1;
    }

    web3.eth.getBlockNumber((err, n)=> {
        if (!err) {
            console.log('getBlockNumber' + n);
            blockNumber = n;
            let lastKey = parseInt(n/10000);
            scanBlockGroup(LastScan,child_last,lastKey*10000,n);
            if(lastKey > 0)
            {
                beginBlock = 0;
                scanBlockGroup(FirstScan,child_first,beginBlock*10000,(beginBlock+1)*10000);
                backBlock = 1;
            }
            if(lastKey > 1)
            {
                backBlock = lastKey-1;
                scanBlockGroup(BackScan,child_back,backBlock*10000,(backBlock+1)*10000);
            }
            globalScan();
            setInterval(function () {
                globalScan();
            },2);
        }
    });

});

function getScanedIndex(begin){
    var key = parseInt(begin/10000);
    let Index = collection.ScanDBCollections.ScanIndexCollection.find({'_id': key});
    console.log("getScanedByWaddr:", Index);
    const value = Index.length === 0 ? key*10000:Index[0].index;
    console.log("getScanedByWaddr:", value);
    return value;
}
function setScanedIndex(scaned) {
    var key = parseInt(scaned/10000);
    console.log("setScanedIndex:", key);
    console.log("setScanedIndex:", scaned);
    var found = collection.ScanDBCollections.ScanIndexCollection.findOne({'_id': key});
    if(found == null) {
        collection.ScanDBCollections.ScanIndexCollection.insert({
            _id: key,
            index: scaned,
        });
    } else {
        found.index = scaned;
        collection.ScanDBCollections.ScanIndexCollection.update(found);
    }
}
function insertTokenOtas( adress,waddress,tokenAddress,value,fromAddress,timeStamp,blockNumber,txHash) {
    try {
        let value1 = value.toString();
        if(waddress.length>134)
        {
            console.log('error waddress:' + waddress);
            console.log('error txHash:' + txHash);
        }
        collection.ScanDBCollections.tokenOTAsScanCollection.insert({ 'index':TokenIndex, 'address':adress,'waddress':waddress,
            'tokenAddress':tokenAddress,'value':value1,'from':fromAddress,
            'timeStamp':timeStamp,'blockNumber':blockNumber,'txHash': txHash});
        ++TokenIndex;
    }catch(err){
        console.log("insertOtabyWaddr:", err);
    }
}
function insertOtas( ota, value, timeStamp,from,blockNumber,txHash) {
    try {
        collection.ScanDBCollections.OTAsScanCollection.insert({ 'index':OTAIndex, 'waddress':ota, 'value':value, 'timeStamp':timeStamp,'otaFrom':from, 'blockNumber':blockNumber,'txHash': txHash});
        ++OTAIndex;
    }catch(err) {
        console.log("insertOtabyWaddr:", err);
    }
}