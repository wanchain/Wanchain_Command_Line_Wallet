
const createKeccakHash = require('keccak');
const ethTx = require("ethereumjs-tx");
const ethUtil = require('ethereumjs-util');
const crypto = require('crypto');
const BN = require('bn.js');
const secp256k1 = require('secp256k1');

const secp256k1_N = new BN("fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141", 16);





const wanchainTx = function (data) {
    // Define Properties
    const fields = [{
        name : 'Txtype',
        length:32,
        allowLess:true,
        default: new Buffer([])
    },{
        name: 'nonce',
        length: 32,
        allowLess: true,
        default: new Buffer([])
    }, {
        name: 'gasPrice',
        length: 32,
        allowLess: true,
        default: new Buffer([])
    }, {
        name: 'gasLimit',
        alias: 'gas',
        length: 32,
        allowLess: true,
        default: new Buffer([])
    }, {
        name: 'to',
        allowZero: true,
        length: 20,
        default: new Buffer([])
    }, {
        name: 'value',
        length: 32,
        allowLess: true,
        default: new Buffer([])
    }, {
        name: 'data',
        alias: 'input',
        allowZero: true,
        default: new Buffer([])
    }, {
        name: 'v',
        length: 1,
        default: new Buffer([0x1c])
    }, {
        name: 'r',
        length: 32,
        allowLess: true,
        default: new Buffer([])
    }, {
        name: 's',
        length: 32,
        allowLess: true,
        default: new Buffer([])
    }]

    /**
     * Returns the rlp encoding of the transaction
     * @method serialize
     * @return {Buffer}
     */
    // attached serialize
    ethUtil.defineProperties(this, fields, data)

    /**
     * @prop {Buffer} from (read only) sender address of this transaction, mathematically derived from other parameters.
     */
    Object.defineProperty(this, 'from', {
        enumerable: true,
        configurable: true,
        get: this.getSenderAddress.bind(this)
    })

    this._homestead = true
}

function extend(Child, Parent) {
    var F = function(){};
    F.prototype = Parent.prototype;
    Child.prototype = new F();
    Child.prototype.constructor = Child;
    Child.uber = Parent.prototype;
}

extend(wanchainTx, ethTx);
/**
 * Computes a sha3-256 hash of the serialized tx
 * @method hash
 * @param {Boolean} [signature=true] whether or not to inculde the signature
 * @return {Buffer}
 */
wanchainTx.prototype.hash = function (signature) {
    let toHash

    if (typeof signature === 'undefined') {
        signature = true
    }

    toHash = signature ? this.raw : this.raw.slice(0, 7)//cr@zy

    // create hash
    return ethUtil.rlphash(toHash)
}



exports.wanchainTx = wanchainTx;

//x * hash(P)P
exports.xScalarHashP = function(x, P) {
    let hashPub = ethUtil.sha3(P);
    let iP = secp256k1.publicKeyTweakMul(P, hashPub);
    let I = secp256k1.publicKeyTweakMul(iP, x);
    return I;
}

exports.waddressLength = 66*2;
exports.isValidWAddress = function (address) {
    return /^0x[0-9a-fA-F]{132}$/i.test(address)
}

exports.toChecksumOTAddress = function (address) {
    address = exports.stripHexPrefix(address).toLowerCase();
    if(address.length != exports.waddressLength){
        return "";
    }
    let abx = address.slice(2,66)+address.slice(68)
    let Cabx = ""
    var hash = ethUtil.sha3(address,512).toString('hex')

    for (var i = 0; i < abx.length; i++) {
        if (parseInt(hash[i], 16) >= 8) {
            Cabx += abx[i].toUpperCase();
        }else{
            Cabx += abx[i];
        }
    }

    return "0x"+address.slice(0,2)+Cabx.slice(0,64)+address.slice(66,68)+Cabx.slice(64);
}

exports.isValidChecksumOTAddress = function (address) {
    return exports.isValidWAddress(address) && (exports.toChecksumOTAddress(address) === address)
}
exports.getDataForSendWanCoin = function(fromWaddr){
    if (!exports.isValidChecksumOTAddress(fromWaddr)){
        return "";
    }
    let Pubkey = exports.stripHexPrefix(fromWaddr).toLowerCase();
    return "0x00"+Pubkey;
}
exports.verifyRinSign = function(ringArgs){
    let sumC = new BN('0');
    for (let i=0; i<ringArgs.w.length;i++){
        sumC = sumC.add(new BN(ringArgs.w[i]));
    }
    sumC = sumC.umod(secp256k1_N);
    console.log("all  sum: ",sumC.toBuffer('be',32).toString('hex'));
    let h = createKeccakHash('keccak256');
    h.update(ringArgs.m);
    for (let i=0; i<ringArgs.w.length;i++){
        let Li = secp256k1.publicKeyCreate(ringArgs.q[i], false);//[qi]G
        let tP = secp256k1.publicKeyTweakMul(ringArgs.PubKeys[i], ringArgs.w[i]);//[wi]Pi
        Li =  secp256k1.publicKeyCombine([Li, tP], false); // [qi]G + [wi]Pi
        h.update(Li);
    }
    for (let i=0; i<ringArgs.q.length;i++){
        let Ric = exports.xScalarHashP(ringArgs.q[i], ringArgs.PubKeys[i]);
        let Ri = secp256k1.publicKeyConvert(Ric, false);
        let wiI = secp256k1.publicKeyTweakMul(ringArgs.I, ringArgs.w[i]);
        Ri = secp256k1.publicKeyCombine([Ri, wiI], false);
        h.update(Ri);
    }
    let hash = h.digest();
    console.log("all hash: ",hash.toString('hex'));
    return hash.toString('hex') == sumC.toBuffer('be',32).toString('hex');
}
exports.getRingSign = function(m,otaSk,otaPubK,ringPubKs){
    let rklen = ringPubKs.length;
    let s = Math.floor(Math.random()*(rklen+1));
    ringPubKs.splice(s, 0, otaPubK);

    let Ic = exports.xScalarHashP(otaSk, otaPubK); //otaSk * hash(otaPubK)otaPubK
    let I = secp256k1.publicKeyConvert(Ic, false);
    let q = [];
    let w = [];
    let sumC = new BN('0');
    let h = createKeccakHash('keccak256');
    h.update(m);
    for(let i=0; i<rklen+1; i++) {
        q.push(_generatePrivateKey());
        w.push(_generatePrivateKey());
        let Li = secp256k1.publicKeyCreate(q[i], false);//[qi]G
        if(i != s){
            let tP = secp256k1.publicKeyTweakMul(ringPubKs[i], w[i]);//[wi]Pi
            Li =  secp256k1.publicKeyCombine([Li, tP], false); // [qi]G + [wi]Pi
            sumC = sumC.add(new BN(w[i]));
            sumC = sumC.umod(secp256k1_N);
        }
        h.update(Li);
        console.log("L",i,": ",Li.toString('hex'));
    }
    for(let i=0; i<rklen+1; i++) {
        let Ric = exports.xScalarHashP(q[i], ringPubKs[i]);
        let Ri = secp256k1.publicKeyConvert(Ric, false);
        if(i != s){
            let wiI = secp256k1.publicKeyTweakMul(I, w[i]);
            Ri = secp256k1.publicKeyCombine([Ri, wiI], false);
        }
        h.update(Ri);
        console.log("R",i,": ",Ri.toString('hex'));
    }
    let cd = h.digest('hex');
    let c = new BN(cd,16).umod(secp256k1_N);
    let cs = c.sub(sumC).umod(secp256k1_N);

    let Qs = new BN(q[s]);
    let bnx = new BN(otaSk).umod(secp256k1_N);
    let csx = cs.mul(bnx).umod(secp256k1_N)//;
    let rs = Qs.sub(csx).umod(secp256k1_N);;
    w[s] = cs.toBuffer('be',32);
    qs_old = q[s];
    q[s] = rs.toBuffer('be',32);
    // check if qs_old*G == qs_new*G + cs * Ps
    let qs_oldXG = secp256k1.publicKeyCreate(qs_old, false);
    console.log("qs_old_XG: ", qs_oldXG.toString('hex'));
    let qs_newXG_1 = secp256k1.publicKeyCreate(q[s], false);
    let qs_newXG_2 = secp256k1.publicKeyTweakMul(ringPubKs[s], w[s]);
    let qs_newXG = secp256k1.publicKeyCombine([qs_newXG_1, qs_newXG_2], false);
    console.log("qs_new_XG: ", qs_newXG.toString('hex'));
    // check end;
    return {
        q:q,
        w:w,
        PubKeys:ringPubKs,
        I: I,
        m: m
    };
}
exports.convertWaddrtoRaw = function(fromWaddr){
    let address = exports.stripHexPrefix(fromWaddr).toLowerCase();
    let pubKeyA = secp256k1.publicKeyConvert(new Buffer(address.slice(0,66), 'hex'), false);
    let pubKeyB = secp256k1.publicKeyConvert(new Buffer(address.slice(66), 'hex'), false);
    let PubKey = secp256k1.publicKeyConvert(pubKeyA,false).toString('hex').slice(2)+secp256k1.publicKeyConvert(pubKeyB,false).toString('hex').slice(2);
    return PubKey;
}
exports.convertRawtoWaddr = function(fromRawaddr){
    let addr = exports.recoverPubkeyFromRaw(fromRawaddr);
    let pubKeyA = addr.A;
    let pubKeyB = addr.B;
    let PubKey = secp256k1.publicKeyConvert(pubKeyA,true).toString('hex')+secp256k1.publicKeyConvert(pubKeyB,true).toString('hex');
    return exports.toChecksumOTAddress(PubKey);
}
exports.generateWaddrFromPriv = function(privA, privB){
    let pubkeyA = secp256k1.publicKeyCreate(privA, true);
    let pubkeyB = secp256k1.publicKeyCreate(privB, true);
    return exports.convertPubKeytoWaddr(pubkeyA, pubkeyB);
}
exports.convertPubKeytoWaddr = function(pubKeyA, pubKeyB){
    let PubKey = secp256k1.publicKeyConvert(pubKeyA,true).toString('hex')+secp256k1.publicKeyConvert(pubKeyB,true).toString('hex');
    return exports.toChecksumOTAddress(PubKey);
}
exports.generateA1 = function(RPrivateKeyDBytes, pubKeyA,  pubKeyB){
    let A1 = secp256k1.publicKeyTweakMul(pubKeyB, RPrivateKeyDBytes, false);
    A1Bytes = ethUtil.sha3(A1);
    A1 = secp256k1.publicKeyTweakAdd(pubKeyA, A1Bytes, false);
    return A1;
}
exports.recoverPubkeyFromWaddress = function(fromWaddr){
    let address = exports.stripHexPrefix(fromWaddr).toLowerCase();
    let pubKeyA = secp256k1.publicKeyConvert(new Buffer(address.slice(0,66), 'hex'), false);
    let pubKeyB = secp256k1.publicKeyConvert(new Buffer(address.slice(66), 'hex'), false);
    return {A:pubKeyA, B:pubKeyB}
}
exports.recoverPubkeyFromRaw = function(fromRaw){
    let rawA = "04"+fromRaw.slice(0,128);
    let rawB = "04"+fromRaw.slice(128);
    let pubKeyA = secp256k1.publicKeyConvert(new Buffer(rawA, 'hex'), false);
    let pubKeyB = secp256k1.publicKeyConvert(new Buffer(rawB, 'hex'), false);
    return {A:pubKeyA, B:pubKeyB}
}
exports.generateOTAWaddress = function (fromWaddr) {
    let PubKey = exports.recoverPubkeyFromWaddress(fromWaddr);
    let pubKeyA = PubKey.A;
    let pubKeyB = PubKey.B;
    let RPrivateKey = _generatePrivateKey();
    let A1 = exports.generateA1(RPrivateKey, pubKeyA, pubKeyB)
    let S1 = secp256k1.publicKeyCreate(new Buffer(RPrivateKey, 'hex'), false);
    let OTAPubKey = secp256k1.publicKeyConvert(A1,true).toString('hex')+secp256k1.publicKeyConvert(S1,true).toString('hex');
    return exports.toChecksumOTAddress(OTAPubKey);
}

/**
 * Returns a `Boolean` on whether or not the a `String` starts with "0x"
 * @param {String} str
 * @return {Boolean}
 */
exports.isHexPrefixed = function (str) {
    return str.slice(0, 2) === '0x'
}

/**
 * Removes "0x" from a given `String`
 * @param {String} str
 * @return {String}
 */
exports.stripHexPrefix = function (str) {
    if (typeof str !== 'string') {
        return str
    }
    return exports.isHexPrefixed(str) ? str.slice(2) : str
}

/**
 * Pads a `String` to have an even length
 * @param {String} a
 * @return {String}
 */
exports.padToEven = function (a) {
    if (a.length % 2) a = '0' + a
    return a
}


exports.otaHash = function(){
    if(arguments.length < 1){
        throw "invalid parameters";
    }
    var buf = new Buffer([]);
    for (i = 0; i < arguments.length; i++){
        item = exports.toBuffer(arguments[i]);
        buf = Buffer.concat([buf, item]);
    }
    return ethUtil.sha3(buf);
}

//strstrPrivateKey shouldn't have 0x prefix
exports.otaSign = function(hashSrc, strPrivateKey){
    var privateKey = new Buffer(strPrivateKey, 'hex')
    return exports.ecsign(hashSrc, privateKey);
}


exports.ascii_to_hexa = function (str)
{
    var arr1 = [];
    for (var n = 0, l = str.length; n < l; n ++)
    {
        var hex = Number(str.charCodeAt(n)).toString(16);
        arr1.push(hex);
    }
    return arr1.join('');
}

//convert number to bytes32 for compatible with contract evm hash implements
//TODO: validate input
exports.numberToBytes32 = function(input){
    if(!input){
        return '';
    }
    var inputStr = input.toString();
    var a2hStr = exports.ascii_to_hexa(inputStr);
    var padding = "";
    for (var i = 0; i < 64 - a2hStr.length; i++){
        padding += "0"
    }
    return '0x' + a2hStr + padding;
}

/**
 * get public key string from private key string
 * @param private key string
 * @return {String|null}
 */
exports.publicKeyFromPrivateKey = function (privateKey) {
    if(!privateKey.startsWith('0x')){
        privateKey = '0x' + privateKey;
    }
    return exports.bufferToHex(exports.privateToPublic(privateKey), 'hex');
}

function _generatePrivateKey(){
    var randomBuf = crypto.randomBytes(32);
    if (secp256k1.privateKeyVerify(randomBuf)){
        return randomBuf;
    } else {
        return _generatePrivateKey();
    }
}

function _generateA1(RPrivateKeyDBytes, pubKeyA,  pubKeyB){
    A1 = secp256k1.publicKeyTweakMul(pubKeyA, RPrivateKeyDBytes, false);
    A1Bytes = ethUtil.sha3(A1);
    A1 = secp256k1.publicKeyTweakAdd(pubKeyB, A1Bytes, false);
    return A1;
}

function _generateOTAPublicKey(pubKeyA, pubKeyB){
    RPrivateKey = _generatePrivateKey();
    A1 = _generateA1(RPrivateKey, pubKeyA, pubKeyB);
    return {
        OtaA1: exports.bufferToHex(A1).slice(4),
        OtaS1: exports.bufferToHex(exports.privateToPublic(RPrivateKey)).slice(2)
    };
}

//input is 128 or 130 byte
function _utilPubkey2SecpFormat(utilPubKeyStr) {
    if(utilPubKeyStr.startsWith('0x')){
        utilPubKeyStr = utilPubKeyStr.slice(2);
    }
    utilPubKeyStr = '04' + utilPubKeyStr;
    return secp256k1.publicKeyConvert(new Buffer(utilPubKeyStr, 'hex'));
}

exports.pubkeyStrCompressed = function(pubStr){
    buf = _utilPubkey2SecpFormat(pubStr);
    return exports.bufferToHex(buf);
}

//get secp256k1 format public key buf
function _secpPUBKBufFromPrivate(privateKey) {
    var pubStr = exports.pulicKeyFromPrivateKey(privateKey);
    return _utilPubkey2SecpFormat(pubStr);
}

exports.generateOTAPublicKey = function (A, B) {
    var pubKeyA =  _utilPubkey2SecpFormat(A);
    var pubKeyB = _utilPubkey2SecpFormat(B);
    return _generateOTAPublicKey(pubKeyA, pubKeyB);
}

function _privateKeyStr2Buf(s) {
    if(s.startsWith('0x')){
        s = s.slice(2);
    }
    return new Buffer(s, 'hex');
}

exports.computeOTAPrivateKey = function(A, S, a, b){
    var otaPubS1 = _utilPubkey2SecpFormat(S);
    var privatekey_a =_privateKeyStr2Buf(a);
    var privatekey_b = _privateKeyStr2Buf(b);
    var pub = secp256k1.publicKeyTweakMul(otaPubS1, privatekey_b, false);
    k = ethUtil.sha3(pub);
    k = secp256k1.privateKeyTweakAdd(k, privatekey_a);
    return k;
}
/*
otaPubS1 is secpFormat
bufa, bufb is privatekey Buffer.
 */
exports.computeWaddrPrivateKey = function(waddr, bufa, bufb){
    let ota = exports.recoverPubkeyFromWaddress(waddr);
    var pub = secp256k1.publicKeyTweakMul(ota.B, bufb, false);
    k = ethUtil.sha3(pub);
    k = secp256k1.privateKeyTweakAdd(k, bufa);
    return k;
}
exports.sha3 = ethUtil.sha3;
exports.web3Wan = require("./web3_wan.js");
exports.coinSCAbi = [{"constant":false,"type":"function","stateMutability":"nonpayable","inputs":[{"name":"OtaAddr","type":"string"},{"name":"Value","type":"uint256"}],"name":"buyCoinNote","outputs":[{"name":"OtaAddr","type":"string"},{"name":"Value","type":"uint256"}]},{"constant":false,"type":"function","inputs":[{"name":"RingSignedData","type":"string"},{"name":"Value","type":"uint256"}],"name":"refundCoin","outputs":[{"name":"RingSignedData","type":"string"},{"name":"Value","type":"uint256"}]},{"constant":false,"inputs":[],"name":"getCoins","outputs":[{"name":"Value","type":"uint256"}]}];
exports.stampSCAbi  = [{"constant":false,"type":"function","stateMutability":"nonpayable","inputs":[{"name":"OtaAddr","type":"string"},{"name":"Value","type":"uint256"}],"name":"buyStamp","outputs":[{"name":"OtaAddr","type":"string"},{"name":"Value","type":"uint256"}]},{"constant":false,"type":"function","inputs":[{"name":"RingSignedData","type":"string"},{"name":"Value","type":"uint256"}],"name":"refundCoin","outputs":[{"name":"RingSignedData","type":"string"},{"name":"Value","type":"uint256"}]},{"constant":false,"type":"function","stateMutability":"nonpayable","inputs":[],"name":"getCoins","outputs":[{"name":"Value","type":"uint256"}]}];

exports.contractCoinAddress = '0x0000000000000000000000000000000000000064';
exports.contractStampAddress = '0x00000000000000000000000000000000000000c8';
















