const Method = require("web3/lib/web3/method");
//const formatters = require('web3/lib/web3/formatters');


function Wan(web3) {
    this._requestManager = web3._requestManager;

    var self = this;

    methods().forEach(function(method) {
        method.attachToObject(self);
        method.setRequestManager(self._requestManager);
    });

    properties().forEach(function(p) {
        p.attachToObject(self);
        p.setRequestManager(self._requestManager);
    });
}

var methods = function () {
    var getOTAMixSet = new Method({
        name: 'getOTAMixSet',
        call: 'wan_getOTAMixSet',
        params: 2
    });
    var getOTABalance = new Method({
        name: 'getOTABalance',
        call: 'eth_getOTABalance',
        params: 1
    });

    return [
        getOTAMixSet,
        getOTABalance
    ];
};
var properties = function () {
    return [];
};
module.exports = Wan;