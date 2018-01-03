let wanUtil = require('wanchain-util');
const web3Require = global.web3Require = require('../wanchain_web3/web3_ipc');
function  getAddressAndKeyFrom(WAddress)
{
    let token_to_ota_a = wanUtil.recoverPubkeyFromWaddress(WAddress).A;
    return "0x"+wanUtil.sha3(token_to_ota_a.slice(1)).slice(-20).toString('hex');
}
web3Require.addSchema(web3Require.schemaAll.sendPrivacySchema(),function (result) {
    web3Require.logger.debug(result);
    let Address = getAddressAndKeyFrom(result.waddress);
    web3Require.logger.debug(Address);
    web3Require.stepNext();
});
web3Require.runschema();