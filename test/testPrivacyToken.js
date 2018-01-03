personal.unlockAccount(eth.accounts[0],"1111111111",99999);
personal.unlockAccount(eth.accounts[2],"1111111111",99999);

var otaAddrStamp = '0x0324D5518906Ca5c08835215D2b17D0B1c63D3002c4230c4a123f7bEe2db7532020232960727Cb87325892584dC4B3165701E0caECF39A54AE8AED8C07aBEf177215';

keyPairs = wan.computeOTAPPKeys(eth.accounts[0], otaAddrStamp).split('+');
privateKeyStamp = keyPairs[0];

var mixStampAddresses = wan.getOTAMixSet(otaAddrStamp,3);
var mixSetWith0x = []
for (i = 0; i < mixStampAddresses.length; i++){
    mixSetWith0x.push(mixStampAddresses[i])
}
var erc20simple_contract = web3.eth.contract([{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_toKey","type":"bytes"},{"name":"_value","type":"uint256"}],"name":"otatransfer","outputs":[{"name":"","type":"string"}],"payable":false,"type":"function","stateMutability":"nonpayable"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"success","type":"bool"}],"payable":false,"type":"function","stateMutability":"nonpayable"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"privacyBalance","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function","stateMutability":"view"},{"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"type":"function","stateMutability":"view"},{"constant":false,"inputs":[{"name":"initialBase","type":"address"},{"name":"baseKeyBytes","type":"bytes"},{"name":"value","type":"uint256"}],"name":"initPrivacyAsset","outputs":[],"payable":false,"type":"function","stateMutability":"nonpayable"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transfer","outputs":[{"name":"success","type":"bool"}],"payable":false,"type":"function","stateMutability":"nonpayable"},{"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"otabalanceOf","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"type":"function","stateMutability":"view"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"otaKey","outputs":[{"name":"","type":"bytes"}],"payable":false,"type":"function","stateMutability":"view"}]);

contractAddr = '0xea5ae5d232a912c3dc1fafd049f3948e363b1800';

erc20simple = erc20simple_contract.at(contractAddr)

var wanAddr = wan.getWanAddress(eth.accounts[1]);
var otaAddrTokenHolder = '0x024352e856C354bC971134e7A5695a45A106bF2063bFe0C2Aa389ACECD2889034d021a564d720fd0e72318F890eEEB4D86De668283113200e8Eb0f35237f9cC5D29b';
keyPairs = wan.computeOTAPPKeys(eth.accounts[0], otaAddrTokenHolder).split('+');
privateKeyTokenHolder = keyPairs[0];
addrTokenHolder = keyPairs[2];
if(addrTokenHolder != '0xfb4330c02c0cd2c556cd27be370937bbc933a2ae'){
    console.log( Error('ota1 balance wrong! balance:' + addrTokenHolder + ', except:' + '0xfb4330c02c0cd2c556cd27be370937bbc933a2ae'));
}
//使用代币发送方的一次性地址的address作为哈希msg，使用邮票私钥做ring sign
var hashMsg = addrTokenHolder
var ringSignData = wan.genRingSignData(hashMsg, privateKeyStamp, mixSetWith0x.join("+"))

//为接收方生成隐私地址
var wanAddr = wan.getWanAddress(eth.accounts[2]);
var otaAddr4Account2 = wan.generateOneTimeAddress(wanAddr);
keyPairs = wan.computeOTAPPKeys(eth.accounts[2], otaAddr4Account2).split('+');
privateKeyOtaAcc2 = keyPairs[0];
addrOTAAcc2 = keyPairs[2];
//contract interface call data

//使用合约接口生成经典的合约调用数据
cxtInterfaceCallData = erc20simple.otatransfer.getData(addrOTAAcc2, otaAddr4Account2, web3.toWin(50));

//拼接环签名数据和合约调用数据
glueContractDef = eth.contract([{"constant":false,"type":"function","inputs":[{"name":"RingSignedData","type":"string"},{"name":"CxtCallParams","type":"bytes"}],"name":"combine","outputs":[{"name":"RingSignedData","type":"string"},{"name":"CxtCallParams","type":"bytes"}]}]);
glueContract = glueContractDef.at("0x0000000000000000000000000000000000000000")
combinedData = glueContract.combine.getData(ringSignData, cxtInterfaceCallData)

//发送隐私保护交易
wan.sendPrivacyCxtTransaction({from:addrTokenHolder, to:contractAddr, value:web3.toWin(10000), data: combinedData}, privateKeyTokenHolder)
//查看接收者账户信息
erc20simple.privacyBalance(addrOTAAcc2)
erc20simple.privacyBalance(addrTokenHolder)

