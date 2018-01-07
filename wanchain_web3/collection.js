let newDb = require('../wanchain_web3/newDb.js');
var config = require('../config');
let scanOTADB = new newDb(config.dataName+'scanOTA.db');
exports.scanOTADB = scanOTADB;


let WalletDBCollections = {
    transCollection : null,
    OTAsCollection : null,
    OTAsIndexColl : null,
    TokenOTAsCollection : null,
    TokenOTAsIndexColl : null,
    tokenCollection: null,
    initCollection(CollectionAry)
    {
        let self = this;
        CollectionAry.forEach((item)=>{
            self[item] = WalletDBCollectionInit[item]();
        });
    }
};
let WalletDBCollectionInit = {
    transCollection : function() {
        return walletDB.getCollection('transaction','transHash');
    },
    OTAsCollection : function() {
        return walletDB.getCollection('OTAsCollection','waddress');
    },
    OTAsIndexColl : function() {
        return walletDB.getCollection('OTAsIndex','address');
    },
    TokenOTAsCollection : function() {
        return walletDB.getCollection('TokenOTAsCollection','waddress');
    },
    TokenOTAsIndexColl :  function() {
        return walletDB.getCollection('TokenOTAsIndex','address');
    },
    tokenCollection :  function() {
        return walletDB.getCollection('tokenCollection');
    }
}
//wallet DB
let walletDB = new newDb(config.dataName+'wanchain.db');
walletDB.InitCollection = function (CollectionAry) {
    WalletDBCollections.initCollection(CollectionAry);
}
exports.walletDB = walletDB;
exports.WalletDBCollections = WalletDBCollections;


//scanDB
let ScanDBCollections = {
    OTAsScanCollection : null,
    tokenOTAsScanCollection : null,
    ScanIndexCollection : null,
    initCollection(CollectionAry)
    {
        let self = this;
        CollectionAry.forEach((item)=>{
            self[item] = ScanDBCollectionsInit[item]();
        });
    }
};
let ScanDBCollectionsInit = {

    OTAsScanCollection : function() {
        return ScanDB.getCollection('OTAsScan','waddress');
    },
    tokenOTAsScanCollection : function() {
        return ScanDB.getCollection('tokenOTAsScan','waddress');
    },
    ScanIndexCollection : function() {
        return ScanDB.getCollection('ScanIndex');
    },
}

let ScanDB = new newDb(config.dataName+'WanchainScanDB.db');
ScanDB.InitCollection = function (CollectionAry) {
    ScanDBCollections.initCollection(CollectionAry);
}

exports.ScanDB = ScanDB;
exports.ScanDBCollections = ScanDBCollections;


let tokenOTADBCollections = {
    tokenOTABalance : null,
    tokenStampCollection : null,
    tokenPrivacyTransCollection : null,
    TokenOTAsCollection : null,
    TokenOTAsIndexColl : null,
    initCollection(CollectionAry)
    {
        let self = this;
        CollectionAry.forEach((item)=>{
            self[item] = tokenOTADBCollectionInit[item]();
        });
    },
    insertTokenCollection(collection,item)
    {
        var data = {'waddress': item.waddress,'tokenAddress' : item.tokenAddress};
        var found = collection.findOne(data);
        if(found == null) {
            var result = collection.maxRecord('_id');
            if(result && result.value)
            {
                item._id = result.value + 1;
            }
            else
            {
                item._id = 1;
            }
            collection.insert(item);
        } else {
            found.value = item.value;
            collection.update(found);
        }
    },
};
let tokenOTADBCollectionInit = {
    tokenOTABalance : function() {
        return tokenOTADB.getCollection('tokenOTABalance');
    },
    tokenStampCollection : function() {
        return tokenOTADB.getCollection('tokenStampCollection','waddress');
    },
    tokenPrivacyTransCollection : function() {
        return tokenOTADB.getCollection('OTAsIndex','transHash');
    },
    TokenOTAsCollection : function() {
        return tokenOTADB.getCollection('TokenOTAsCollection','waddress');
    },
    TokenOTAsIndexColl :  function() {
        return tokenOTADB.getCollection('TokenOTAsIndex','address');
    },
    tokenCollection :  function() {
        return tokenOTADB.getCollection('tokenCollection');
    }
}
let tokenOTADB = new newDb(config.dataName+'tokenOTADB.db');
tokenOTADB.InitCollection = function (CollectionAry) {
    tokenOTADBCollections.initCollection(CollectionAry);
}
exports.tokenOTADB = tokenOTADB;
exports.tokenOTADBCollections = tokenOTADBCollections;


exports.getCollectionItem = function(item) {
    var newItem = {};
    for (var key in item) {
        if(key !== 'meta' && key !== '$loki')
        {
            newItem[key] = item[key];
        }
    }
    return newItem;
};