const fs = require('fs');
const path = require('path');
const solc = require('solc');
exports.getTokenBalance = function (web3,TokenAddress,accountAddress,callback) {
    let content = fs.readFileSync(path.join("../sol", "ERC20.sol"), 'utf8');
    let compiled = solc.compile(content, 1);

    let Contract = web3.eth.contract(JSON.parse(compiled.contracts[':ERC20'].interface));
    let TokenInstance = Contract.at(TokenAddress);
    return TokenInstance.balanceOf(accountAddress,callback);
}
exports.getTokenData = function (web3,TokenAddress,toAddress,amount) {
    let content = fs.readFileSync(path.join("../sol", "ERC20.sol"), 'utf8');
    let compiled = solc.compile(content, 1);
    let Contract = web3.eth.contract(JSON.parse(compiled.contracts[':ERC20'].interface));
    let TokenInstance = Contract.at(TokenAddress);
    return TokenInstance.transfer.getData(toAddress,amount);
}
