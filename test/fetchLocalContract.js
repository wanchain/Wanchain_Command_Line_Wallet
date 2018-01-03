
const web3Require = global.web3Require = require('../wanchain_web3/web3_ipc');
// Start the prompt
web3Require.useWalletDb();
web3Require.run(function () {
    web3Require.fetchLocalContract();
});

