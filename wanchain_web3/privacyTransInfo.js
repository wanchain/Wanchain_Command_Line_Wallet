const config = require('../config');
let wanUtil = require('wanchain-util');
let keyStore = require('./keyStore.js');
const secp256k1 = require('secp256k1');
const fetchMyOta = require('../wanchain_web3/nodeScan.js');
const privacyInfo = {
    toCoinContractAddr : wanUtil.contractCoinAddress,
    sendPrivacyData(web3,toWAddress,amount)
    {
        let CoinContractAddr = wanUtil.contractCoinAddress;
        let CoinContract = web3.eth.contract(wanUtil.coinSCAbi);
        let CoinContractInstance = CoinContract.at(CoinContractAddr);
        let otaAddr = wanUtil.generateOTAWaddress(toWAddress);
        return CoinContractInstance.buyCoinNote.getData(otaAddr, web3.toWei(amount));
    },
    getRingSignData(web3,address,password,OTAAddress,message,mixNumber,callback)
    {
        web3.wan.getOTAMixSet(OTAAddress, mixNumber, function (err, otaSet) {
            if (!err) {
                let privKey = keyStore.getPrivateKey(address, password);
                if (privKey) {
                    let otaSk = wanUtil.computeWaddrPrivateKey(OTAAddress, privKey[0], privKey[1]);
                    let otaPub = wanUtil.recoverPubkeyFromWaddress(OTAAddress);
                    let otaPubK = otaPub.A;
                    let otaSetBuf = [];
                    for (let i = 0; i < otaSet.length; i++) {
                        let rpkc = new Buffer(otaSet[i].slice(2, 68), 'hex');
                        let rpcu = secp256k1.publicKeyConvert(rpkc, false);
                        otaSetBuf.push(rpcu);
                    }

                    let ringArgs = wanUtil.getRingSign(message, otaSk, otaPubK, otaSetBuf);
                    let KIWQ = generatePubkeyIWQforRing(ringArgs.PubKeys, ringArgs.I, ringArgs.w, ringArgs.q);
                    callback(null,KIWQ);
                }
                else {
                    callback('error password',null);
                }
            }
            else {
                callback(err,null);
            }
        });
    },
    refundPrivacyData(web3,address,password,OTAAddress,amount,callback) {
         let self = this;
         let CoinContractAddr = wanUtil.contractCoinAddress;
         let CoinContract = web3.eth.contract(wanUtil.coinSCAbi);
         let CoinContractInstance = CoinContract.at(CoinContractAddr);
         let M = new Buffer(address.slice(2), 'hex');
         self.getRingSignData(web3,address,password,OTAAddress,M,config.OTAMixNumber,function (err,result) {
            if(!err)
            {
                callback(null,CoinContractInstance.refundCoin.getData(result, amount));
            }
            else
            {
                callback(err,result);
            }
         });
    },
    fetchOTAS(address,password)
    {
        let keystore = keyStore.getKeystoreJSON(address);
        if (keystore)
        {
            fetchMyOta.start(keystore,password);
        }
    },

}
function generatePubkeyIWQforRing(Pubs, I, w, q){
    let length = Pubs.length;
    let sPubs  = [];
    for(let i=0; i<length; i++){
        sPubs.push(Pubs[i].toString('hex'));
    }
    let ssPubs = sPubs.join('&');
    let ssI = I.toString('hex');
    let sw  = [];
    for(let i=0; i<length; i++){
        sw.push('0x'+w[i].toString('hex').replace(/(^0*)/g,""));
    }
    let ssw = sw.join('&');
    let sq  = [];
    for(let i=0; i<length; i++){
        sq.push('0x'+q[i].toString('hex').replace(/(^0*)/g,""));
    }
    let ssq = sq.join('&');

    let KWQ = [ssPubs,ssI,ssw,ssq].join('+');
    return KWQ;
};
module.exports = privacyInfo;