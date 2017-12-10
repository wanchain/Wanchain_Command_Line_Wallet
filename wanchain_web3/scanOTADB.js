const scanDb = require('./collection.js').scanOTADB;

exports.getScanedIndex = function(){
    let waddr = '0x0';
    let ScanBlockIndex = scanDb.getCollection('ScanBlockIndex');
    let Index = ScanBlockIndex.find({'_id': waddr});
    console.log("getScanedByWaddr:", Index);
    const begin = Index.length === 0 ? 0:Index[0].index;
    return begin;
}
exports.setScanedIndex = function (scaned) {
    let waddr = '0x0';
    let ScanBlockIndex = scanDb.getCollection('ScanBlockIndex');
    var found = ScanBlockIndex.findOne({'_id': waddr});
    if(found == null) {
        ScanBlockIndex.insert({
            _id: waddr,
            index: scaned,
        });
        console.log('setScanedByWaddr:', waddr, 'insert');
    } else {
        found.index = scaned;
        ScanBlockIndex.update(found);
        console.log('setScanedByWaddr:', waddr, 'update');
    }
}
exports.insertOtas = function( ota, value, state,timeStamp,from,blockNumber) {
    let OTAsCollection = scanDb.getCollection('OTAsCollection');
    try {
        OTAsCollection.insert({ '_id':ota, 'value':value, 'state':state, 'timeStamp':timeStamp,'otaFrom':from, 'blockNumber':blockNumber});
    }catch(err){
        console.log("insertOtabyWaddr:", err);
    }
}
exports.requireOTAs = (where) =>
{
    let OTAsCollection = scanDb.getCollection('OTAsCollection');
    return OTAsCollection.find(where);
}