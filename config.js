const config = {};

// web3 parameter
config.host = '// http://localhost'; // http://localhost
config.rpcIpcPath = process.env.HOME;
if (process.platform === 'darwin') {
    config.rpcIpcPath += '/Library/Wanchain/gwan.ipc';
} else if (process.platform === 'freebsd' ||
    process.platform === 'linux' ||
    process.platform === 'sunos') {
    config.rpcIpcPath += '/.wanchain/gwan.ipc';
} else if (process.platform === 'win32') {
    config.rpcIpcPath = '\\\\.\\pipe\\gwan.ipc';
}
config.keyStorePath = process.env.HOME;
if (process.platform === 'darwin') {
    config.keyStorePath += '/Library/wanchain/keystore/';
}

if (process.platform === 'freebsd' ||
    process.platform === 'linux' ||
    process.platform === 'sunos') {
    config.keyStorePath += '/.wanchain/keystore/';
}

if (process.platform === 'win32') {
    config.keyStorePath = process.env.APPDATA + '\\wanchain\\keystore\\';
}
// config.host = 'http://192.168.1.77'; // http://localhost
config.port = 8545;

// Instance Address
config.contractInstanceAddress = '0x0000000000000000000000000000000000000064';
config.contractStampAddress = '0x00000000000000000000000000000000000000c8';

// Monitor.js parameter
config.ota = '027396B6b9dDeA223089114b5ceBb61114AAf626cce2616497Fbbda2F076De716503B26a2ACa9238aF011C73dE1e10f669d515e50455F86a803488a358B0Be07F48E';
config.refundValue = 1000000000000000000;

// preCompiledTest.js parameter
config.from_sk = 'a4369e77024c2ade4994a9345af5c47598c7cfb36c65e8a4a3117519883d9014';
config.from_address = '0x2d0e7c0813a51d3bd1d08246af2a8a7a57d8922e';
config.to_waddress = '0x0340721B2B6C7970A443B215951C7BAa4c41c35E2b591EA51016Eae523f5E123760354b82CccbEdC5c84F16D63414d44F595d85FD9e46C617E29e3AE2e82C5F7bDA9';
config.transferValue = 1000000000000000000;


// console color
config.consoleColor = {
	'COLOR_FgRed': '\x1b[31m',
	'COLOR_FgYellow': '\x1b[33m',
	'COLOR_FgGreen': "\x1b[32m"
};

// config.stampType = {
// 	TypeOne:0,
// 	TypeTwo:1,
// 	TypeFour:2,
// 	TypeEight:3,
// 	TypeSixteen:4
// };

module.exports = config;
