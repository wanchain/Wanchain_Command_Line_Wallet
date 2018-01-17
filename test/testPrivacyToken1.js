// before use the file, please desploy yourself contract and replace the contractAddr value with the new address!!!

priTranValue = web3.toWin(50);
priTranValue = 888;

var wanBalance = function(addr){
    return web3.fromWin(web3.eth.getBalance(addr));
}

var wanUnlock = function(addr){
    return personal.unlockAccount(addr,"1111111111",99999);
}

var sendWanFromUnlock = function (From, To , V){
    eth.sendTransaction({from:From, to: To, value: web3.toWin(V)});
}

var wait = function (conditionFunc) {
    var loopLimit = 120;
    var loopTimes = 0;
    while (!conditionFunc()) {
        admin.sleep(2);
        loopTimes++;
        if(loopTimes>=loopLimit){
            throw Error("wait timeout! conditionFunc:" + conditionFunc)
        }
    }
}

wanUnlock(eth.accounts[0])
wanUnlock(eth.accounts[2])

stampBalance = 0.09;

abiDefStamp = [{"constant":false,"type":"function","stateMutability":"nonpayable","inputs":[{"name":"OtaAddr","type":"string"},{"name":"Value","type":"uint256"}],"name":"buyStamp","outputs":[{"name":"OtaAddr","type":"string"},{"name":"Value","type":"uint256"}]},{"constant":false,"type":"function","inputs":[{"name":"RingSignedData","type":"string"},{"name":"Value","type":"uint256"}],"name":"refundCoin","outputs":[{"name":"RingSignedData","type":"string"},{"name":"Value","type":"uint256"}]},{"constant":false,"type":"function","stateMutability":"nonpayable","inputs":[],"name":"getCoins","outputs":[{"name":"Value","type":"uint256"}]}];

contractDef = eth.contract(abiDefStamp);
stampContractAddr = "0x00000000000000000000000000000000000000c8";
stampContract = contractDef.at(stampContractAddr);


var wanAddr = wan.getWanAddress(eth.accounts[0]);
var otaAddrStamp = wan.generateOneTimeAddress(wanAddr);
txBuyData = stampContract.buyStamp.getData(otaAddrStamp, web3.toWin(stampBalance));


sendTx = eth.sendTransaction({from:eth.accounts[0], to:stampContractAddr, value:web3.toWin(stampBalance), data:txBuyData, gas: 1000000});
wait(function(){return eth.getTransaction(sendTx).blockNumber != null;});


keyPairs = wan.computeOTAPPKeys(eth.accounts[0], otaAddrStamp).split('+');
privateKeyStamp = keyPairs[0];

var mixStampAddresses = wan.getOTAMixSet(otaAddrStamp,2);
var mixSetWith0x = []
for (i = 0; i < mixStampAddresses.length; i++){
    mixSetWith0x.push(mixStampAddresses[i])
}



var erc20simple_contract = web3.eth.contract([{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_toKey","type":"bytes"},{"name":"_value","type":"uint256"}],"name":"otatransfer","outputs":[{"name":"","type":"string"}],"payable":false,"type":"function","stateMutability":"nonpayable"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"success","type":"bool"}],"payable":false,"type":"function","stateMutability":"nonpayable"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"privacyBalance","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function","stateMutability":"view"},{"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"type":"function","stateMutability":"view"},{"constant":false,"inputs":[{"name":"initialBase","type":"address"},{"name":"baseKeyBytes","type":"bytes"},{"name":"value","type":"uint256"}],"name":"initPrivacyAsset","outputs":[],"payable":false,"type":"function","stateMutability":"nonpayable"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transfer","outputs":[{"name":"success","type":"bool"}],"payable":false,"type":"function","stateMutability":"nonpayable"},{"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"otabalanceOf","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"type":"function","stateMutability":"view"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"otaKey","outputs":[{"name":"","type":"bytes"}],"payable":false,"type":"function","stateMutability":"view"}]);
contractAddr = '0x2572b9581b0199ea1a1f9b46f8a9b6df76ec79ad';
erc20simple = erc20simple_contract.at(contractAddr)



var otaAddrTokenHolder = '0x024352e856C354bC971134e7A5695a45A106bF2063bFe0C2Aa389ACECD2889034d021a564d720fd0e72318F890eEEB4D86De668283113200e8Eb0f35237f9cC5D29b';
keyPairs = wan.computeOTAPPKeys(eth.accounts[0], otaAddrTokenHolder).split('+');
privateKeyTokenHolder = keyPairs[0];
addrTokenHolder = keyPairs[2];


ota1Balance = erc20simple.privacyBalance(addrTokenHolder)

var hashMsg = addrTokenHolder
var ringSignData = wan.genRingSignData(hashMsg, privateKeyStamp, mixSetWith0x.join("+"))

var wanAddr = wan.getWanAddress(eth.accounts[1]);
var otaAddr4Account2 = wanAddr;
//keyPairs = wan.computeOTAPPKeys(eth.accounts[2], otaAddr4Account2).split('+');
//privateKeyOtaAcc2 = keyPairs[0];
addrOTAAcc2 = eth.accounts[1];

cxtInterfaceCallData = erc20simple.otatransfer.getData(addrOTAAcc2, otaAddr4Account2, priTranValue);

glueContractDef = eth.contract([{"constant":false,"type":"function","inputs":[{"name":"RingSignedData","type":"string"},{"name":"CxtCallParams","type":"bytes"}],"name":"combine","outputs":[{"name":"RingSignedData","type":"string"},{"name":"CxtCallParams","type":"bytes"}]}]);
glueContract = glueContractDef.at("0x0000000000000000000000000000000000000000")
combinedData = glueContract.combine.getData(ringSignData, cxtInterfaceCallData)

sendTx = wan.sendPrivacyCxtTransaction({from:addrTokenHolder, to:contractAddr, value:0, data: combinedData, gasprice:'0x' + (20000000000).toString(16)}, privateKeyTokenHolder)
wait(function(){return eth.getTransaction(sendTx).blockNumber != null;});


ota2Balance = erc20simple.privacyBalance(addrOTAAcc2)
if (ota2Balance != priTranValue) {
    throw Error("ota2 balance wrong. balance:" + ota2Balance +  ", expect:" + priTranValue)
}

ota1Balance = erc20simple.privacyBalance(addrTokenHolder)

