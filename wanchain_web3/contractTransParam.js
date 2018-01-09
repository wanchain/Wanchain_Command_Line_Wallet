const wanToken = require('../wanchain_web3/wanToken.js')
let wanUtil = require('wanchain-util');
let fhs_combineNote = wanUtil.sha3('combine(string,bytes)', 256).slice(0,4).toString('hex');
let fhs_OTATransferNote = wanUtil.sha3('otatransfer(address,bytes,uint256)', 256).slice(0,4).toString('hex');
const SolidityCoder = require('web3/lib/solidity/coder');
let fhs_buyCoinNote = wanUtil.sha3('buyCoinNote(string,uint256)', 256).slice(0,4).toString('hex');
let fhs_SentOtatransfer = wanUtil.sha3('SentOtatransfer(address,address,bytes,uint256)', 256).toString('hex');
const coinContractAddr = wanUtil.contractCoinAddress;
let keyStore = require('./keyStore.js');
var keythereum = require("keythereum");
let collection = require('../wanchain_web3/collection.js');
const contractTransParam = {
    parseContractMethodPara(paraData, abi, method) {
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
    },
    parseTopicData(data)
    {
        let SentOtatransferParam = [{
            "anonymous":false,
            "inputs":[
            {"indexed":false,"name":"_tokey","type":"bytes"},
            {"indexed":false,"name":"amount","type":"uint256"}],
            "name":"SentOtatransfer",
            "type":"event"
        }];
        let input = data.slice(2);
        let paras = this.parseContractMethodPara(input, SentOtatransferParam, 'SentOtatransfer');
        return paras;

    },
    isTokenOTA(tx)
    {
        if (tx.txType == "0x6") {

            let cmd = tx.input.slice(2, 10).toString('hex');
            if (cmd == fhs_combineNote) {
                return true;
            }
        }
        return false;
    },
    parseContractTokenOTA(input)
    {
        let inputPara = input.slice(10);
        let paras = this.parseContractMethodPara(inputPara, wanToken.constractPrivacyToken, 'combine');
        return paras;
    },
    isOTATransfer(input)
    {
        let cmd = input.slice(2, 10).toString('hex');
        return cmd == fhs_OTATransferNote;
    },
    parseContractOTATransfer(input)
    {
        let inputPara = input.slice(10);
        let paras = this.parseContractMethodPara(inputPara, wanToken.constractCodeOTA, 'otatransfer');
        return paras;
    },
    isPrivacyOTA(tx) {
        if (tx.to == coinContractAddr) {
            let cmd = tx.input.slice(2, 10).toString('hex');
            if (cmd == fhs_buyCoinNote) {
                return true;
            }
        }
    },
    parsePrivacyOTA(input)
    {
        let inputPara = input.slice(10);
        let paras = this.parseContractMethodPara(inputPara, wanUtil.coinSCAbi, 'buyCoinNote');
        return paras;
    },
    getOTAKeys(keystore,password) {
        let keyBObj = {version:keystore.version, crypto:keystore.crypto2};
        let keyAObj = {version:keystore.version, crypto:keystore.crypto};
        let privKeyA;
        let privKeyB;
        try {
            privKeyA = keythereum.recover(password, keyAObj);
            privKeyB = keythereum.recover(password, keyBObj);
        }catch(error){
            console.log('wan_refundCoin', 'wrong password');
            return;
        }
        let waddress = keystore.waddress;
        const myPub = wanUtil.recoverPubkeyFromWaddress(waddress);
        let pubKeyA = myPub.A;
        return [privKeyB,pubKeyA];
    },
    compareOta(waddress,privKeyB,pubKeyA) {
        let otaPub = wanUtil.recoverPubkeyFromWaddress(waddress);
        let A1 = wanUtil.generateA1(privKeyB, pubKeyA, otaPub.B);

        if (A1.toString('hex') === otaPub.A.toString('hex'))
        {
            return true;
        }
        return false;
    },
    fetchTokenOTAsFromLogDb(web3,address,password,OTAsIndexColl,OTAColl,func,funcExit)
    {
        let self = this;
        web3.eth.getBlockNumber((err, lastBlock) => {
            if (!err) {
                var findvalue = OTAsIndexColl.findOne({address:address});
                let lastIndex = 0;
                if(findvalue)
                {
                    lastIndex = findvalue.index;
                }
                let filterValue = {fromBlock: lastIndex, toBlock: lastBlock,topics: ['0x'+fhs_SentOtatransfer]};
                let filter = web3Require.web3_ipc.eth.filter(filterValue);
                filter.get((err, result)=>{
                    if(result.length>0)
                    {
                        let keystore = keyStore.getKeystoreJSON(address);
                        if (keystore) {
                            let otaKeys = this.getOTAKeys(keystore, password);
                            if(!otaKeys)
                                return funcExit();
                            for (var i = 0; i < result.length; ++i) {
                                let Ota = result[i];
                                let param = self.parseTopicData(Ota.data);
                                let waddress = param._tokey.toString('hex');
                                let nLen = Ota.address.length-2;
                                let fromAdress = '0x'+ Ota.topics[1].slice(-nLen);
                                let toAdress = '0x'+  Ota.topics[2].slice(-nLen);
                                if(waddress.length !== 134)
                                    continue;
                                if (this.compareOta(waddress,otaKeys[0],otaKeys[1])) {
                                    var found = OTAColl.findOne({'waddress': waddress});
                                    if(!found)
                                    {
                                        let newItem = {'address':toAdress,'waddress':waddress,
                                            'tokenAddress':Ota.address,'value':param.amount.toString(),'from':fromAdress,
                                            'blockNumber':Ota.blockNumber,'txHash': Ota.transactionHash,'toaddress':keystore.waddress};
                                        OTAColl.insert(newItem);
                                        console.log('find new OTA: ' + newItem.waddress);
                                        if(func)
                                        {
                                            func(newItem);
                                        }

                                    }
                                }
                            }
                        }
                    }
                    if(!err)
                    {
                        if(findvalue)
                        {
                            findvalue.index = lastBlock;
                            OTAsIndexColl.update(findvalue);
                        }
                        else
                        {
                            findvalue = {address:address,index:lastBlock}
                            OTAsIndexColl.insert(findvalue);
                        }
                    }
                    if(funcExit)
                    {
                        funcExit(err);
                    }
                });
            }
            else if(funcExit)
            {
                funcExit(err);
            }
        });
    },
    fetchOTAs(address,password,OTACollection,OTAsIndexColl,OTAColl,func)
    {
        let keystore = keyStore.getKeystoreJSON(address);
        if (keystore) {
            var findvalue = OTAsIndexColl.findOne({address:address});
            let lastIndex = 0;
            if(findvalue)
            {
                lastIndex = findvalue.index;
            }
            let maxIndex = OTACollection.maxRecord('index');
            let where = {index: {'$gte': lastIndex, '$lte': maxIndex}};
            let otaSet = OTACollection.find(where);
            console.log('checkOta otaSet length:', otaSet.length);
            if (otaSet.length > 0) {
                let otaKeys = this.getOTAKeys(keystore, password);
                if(otaKeys == null)
                    return;
                for (var i = 0; i < otaSet.length; ++i) {
                    var Ota = otaSet[i];
                    if(Ota.waddress.length !== 134)
                        continue;
                    if (this.compareOta(Ota.waddress,otaKeys[0],otaKeys[1])) {
                        var newItem = collection.getCollectionItem(Ota);
                        var found = OTAColl.findOne({'waddress': newItem.waddress});
                        if(!found)
                        {
                            newItem.state = '0';
                            newItem.toaddress = keystore.waddress;
                            delete newItem['index'];
                            OTAColl.insert(newItem);
                            console.log('find new OTA: ' + newItem.waddress);
                            if(func)
                            {
                                func(newItem);
                            }
                        }
                        if(findvalue)
                        {
                            findvalue.index = lastIndex + i+1;
                            OTAsIndexColl.update(findvalue);
                        }
                        else
                        {
                            findvalue = {address:address,index:lastIndex+i+1}
                            OTAsIndexColl.insert(findvalue);
                        }

                    }
                }
                if(findvalue)
                {
                    findvalue.index = lastIndex + otaSet.length;
                    OTAsIndexColl.update(findvalue);
                }
                else
                {
                    findvalue = {address:address,index:lastIndex+otaSet.length}
                    OTAsIndexColl.insert(findvalue);
                }
            }
        }

    },
}
module.exports = contractTransParam;