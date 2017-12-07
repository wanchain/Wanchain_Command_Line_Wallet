#!/usr/bin/env node


const w = require("./index.js");

const wrlp = w.rlp;
console.log(wrlp.decode);


const wtx = w.ethereumTx;
console.log(wtx)

const wutil = w.ethereumUtil;
console.log(wutil.otaHash)
console.log(wutil.SHA3_RLP_S)

