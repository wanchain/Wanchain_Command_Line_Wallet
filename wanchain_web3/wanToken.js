const fs = require('fs');
const config = require('../config');
const solc = require('solc');
let wanUtil = require('wanchain-util');
const pirvacyInfo = require('./privacyTransInfo.js');
var constractCode = [{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],"name":"approve","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_toKey","type":"bytes"},{"name":"_value","type":"uint256"}],"name":"otatransfer","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"privacyBalance","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"wanport","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"initialBase","type":"address"},{"name":"baseKeyBytes","type":"bytes"},{"name":"value","type":"uint256"}],"name":"initPrivacyAsset","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transfer","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"otabalanceOf","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"},{"name":"_spender","type":"address"}],"name":"allowance","outputs":[{"name":"remaining","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"receipient","type":"address"}],"name":"buyWanCoin","outputs":[{"name":"","type":"bool"}],"payable":true,"stateMutability":"payable","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"otaKey","outputs":[{"name":"","type":"bytes"}],"payable":false,"stateMutability":"view","type":"function"},{"payable":true,"stateMutability":"payable","type":"fallback"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_from","type":"address"},{"indexed":true,"name":"_to","type":"address"},{"indexed":false,"name":"_value","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_owner","type":"address"},{"indexed":true,"name":"_spender","type":"address"},{"indexed":false,"name":"_value","type":"uint256"}],"name":"Approval","type":"event"}];
var constractCodeOTA = [{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_toKey","type":"bytes"},{"name":"_value","type":"uint256"}],"name":"otatransfer","outputs":[{"name":"","type":"string"}],"payable":false,"type":"function","stateMutability":"nonpayable"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"success","type":"bool"}],"payable":false,"type":"function","stateMutability":"nonpayable"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"privacyBalance","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function","stateMutability":"view"},{"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"type":"function","stateMutability":"view"},{"constant":false,"inputs":[{"name":"initialBase","type":"address"},{"name":"baseKeyBytes","type":"bytes"},{"name":"value","type":"uint256"}],"name":"initPrivacyAsset","outputs":[],"payable":false,"type":"function","stateMutability":"nonpayable"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transfer","outputs":[{"name":"success","type":"bool"}],"payable":false,"type":"function","stateMutability":"nonpayable"},{"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"otabalanceOf","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"type":"function","stateMutability":"view"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"otaKey","outputs":[{"name":"","type":"bytes"}],"payable":false,"type":"function","stateMutability":"view"}]
var constractPrivacyToken = [{"constant":false,"type":"function","inputs":[{"name":"RingSignedData","type":"string"},{"name":"CxtCallParams","type":"bytes"}],"name":"combine","outputs":[{"name":"RingSignedData","type":"string"},{"name":"CxtCallParams","type":"bytes"}]}];
exports.constractPrivacyToken = constractPrivacyToken;
exports.constractCodeOTA = constractCodeOTA;
exports.getTokenBalance = function (web3,TokenAddress,accountAddress,callback) {
//    let content = fs.readFileSync(path.join("../sol", "ERC20.sol"), 'utf8');
//    let compiled = solc.compile(content, 1);

//    let Contract = web3.eth.contract(JSON.parse(compiled.contracts[':ERC20'].interface));
    var standardtokenContract = web3.eth.contract(constractCode);
    let TokenInstance = standardtokenContract.at(TokenAddress);
    return TokenInstance.balanceOf(accountAddress,callback);
}
exports.getTokenData = function (web3,TokenAddress,toAddress,amount) {
//    let content = fs.readFileSync(path.join("../sol", "ERC20.sol"), 'utf8');
//    let compiled = solc.compile(content, 1);
//    let Contract = web3.eth.contract(JSON.parse(compiled.contracts[':ERC20'].interface));
    var standardtokenContract = web3.eth.contract(constractCode);
    let TokenInstance = standardtokenContract.at(TokenAddress);
    return TokenInstance.transfer.getData(toAddress,amount);
}
exports.getWanCoinData = function (web3,TokenAddress,amount) {
    let content = fs.readFileSync('../sol/fetchWanCoin.sol', 'utf8');
    let compiled = solc.compile(content, 1);
    let Contract = web3.eth.contract(JSON.parse(compiled.contracts[':fetchWanCoin'].interface));
    let TokenInstance = Contract.at(TokenAddress);
    return TokenInstance.sendWanCoin.getData(amount);
}
exports.deployContractData = function (web3,keyFile,contract) {
    let content = fs.readFileSync(keyFile, 'utf8');
    let compiled = solc.compile(content, 1);
    let name;
    if(!contract)
    {
        for (var key in compiled.contracts) {
            name = key;
//        break;
        }
    }
    else
    {
        name = ':' + contract;
    }
    let Contract = web3.eth.contract(JSON.parse(compiled.contracts[name].interface));
    var constructorInputs = [];
    constructorInputs.push({ data: compiled.contracts[name].bytecode});
    var txData = '0x' + Contract.new.getData.apply(null, constructorInputs);
    return txData;
}
function  getAddressAndKeyFrom(WAddress)
{
    let token_to_ota_a = wanUtil.recoverPubkeyFromWaddress(WAddress).A;
    return "0x"+wanUtil.sha3(token_to_ota_a.slice(1)).slice(-20).toString('hex');
}
exports.initPrivacyAssetData = function (web3,curAddress,curWaddress,TokenAddress,amount) {
    var otaAddrTokenHolder = wanUtil.generateOTAWaddress(curWaddress);
    var addrTokenHolder = getAddressAndKeyFrom(otaAddrTokenHolder);
    var standardtokenContract = web3.eth.contract(constractCodeOTA);
    let TokenInstance = standardtokenContract.at(TokenAddress);
    console.log(addrTokenHolder);
    console.log(otaAddrTokenHolder);
    var data = TokenInstance.initPrivacyAsset.getData(addrTokenHolder, otaAddrTokenHolder, amount);
    return [addrTokenHolder,otaAddrTokenHolder,data];
}
exports.getTokenPrivacyBalance = function (web3,TokenAddress,OTAwaddress,callback) {
//    let content = fs.readFileSync(path.join("../sol", "ERC20.sol"), 'utf8');
//    let compiled = solc.compile(content, 1);

//    let Contract = web3.eth.contract(JSON.parse(compiled.contracts[':ERC20'].interface));
    var address = getAddressAndKeyFrom(OTAwaddress);
    var standardtokenContract = web3.eth.contract(constractCodeOTA);
    let TokenInstance = standardtokenContract.at(TokenAddress);
    TokenInstance.privacyBalance(address,callback);
}

exports.stampContractAddr = "0x00000000000000000000000000000000000000c8";
exports.getStampData = function(web3,curAddress,curWaddress,stampBalance)
{
    var abiDefStamp = [{"constant":false,"type":"function","stateMutability":"nonpayable","inputs":[{"name":"OtaAddr","type":"string"},{"name":"Value","type":"uint256"}],"name":"buyStamp","outputs":[{"name":"OtaAddr","type":"string"},{"name":"Value","type":"uint256"}]},{"constant":false,"type":"function","inputs":[{"name":"RingSignedData","type":"string"},{"name":"Value","type":"uint256"}],"name":"refundCoin","outputs":[{"name":"RingSignedData","type":"string"},{"name":"Value","type":"uint256"}]},{"constant":false,"type":"function","stateMutability":"nonpayable","inputs":[],"name":"getCoins","outputs":[{"name":"Value","type":"uint256"}]}];
    var contractDef = web3.eth.contract(abiDefStamp);
    var stampContractAddr = "0x00000000000000000000000000000000000000c8";
    var stampContract = contractDef.at(stampContractAddr);

    var otaAddrStamp = wanUtil.generateOTAWaddress(curWaddress);
    var txBuyData = stampContract.buyStamp.getData(otaAddrStamp, stampBalance);
    return [otaAddrStamp,txBuyData];

}
exports.getTokenPrivacyData = function (web3,address,password,stampOTA,
                                        fromTokenWAddr,TokenAddress,toWaddress,value,callBack) {
    let fromTokenAddr = getAddressAndKeyFrom(fromTokenWAddr);
    let M = new Buffer(fromTokenAddr.slice(2), 'hex');
    pirvacyInfo.getRingSignData(web3,address,password,stampOTA,M,config.StampMixNumber,function (err, result) {
        if (!err) {

            var standardtokenContract = web3.eth.contract(constractCodeOTA);
            let TokenInstance = standardtokenContract.at(TokenAddress);

            var otaAddrAccount2 = wanUtil.generateOTAWaddress(toWaddress);
            var addrOTA2 = getAddressAndKeyFrom(otaAddrAccount2);

            var cxtInterfaceCallData = TokenInstance.otatransfer.getData(addrOTA2, otaAddrAccount2, value);

            var glueContractDef = web3.eth.contract(constractPrivacyToken);
            var glueContract = glueContractDef.at("0x0000000000000000000000000000000000000000")
            var combinedData = glueContract.combine.getData(result, cxtInterfaceCallData);
            callBack(null,[fromTokenAddr,otaAddrAccount2,combinedData]);
        }
        else
        {
            callBack(err,result);
        }
    });
}