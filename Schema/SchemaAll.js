var colors = require("colors/safe");
function Qmsg(desc) {
    return colors.magenta(desc+'[Q\\q to exit]:');
};
function CheckProcessExit(value) {
    if(value == 'Q' || value == 'q')
    {
        console.log('Exiting...');
        process.exit();
    }
    return true;
};
var SchemaAll = {
    properties: {
        password: {
            pattern: '[^\u4e00-\u9fa5]+',
            message: "Password invalid or too short!",
            description: Qmsg("Enter password: "),
            hidden: true,
            replace: '*',
            required: true,
            conform : function (value) {
                CheckProcessExit(value);
                var aaa = new String(value);
                return aaa.length>5;
            }
        },
        repeatPass:{
            pattern: '[^\u4e00-\u9fa5]+',
            message: "Password invalid",
            description: Qmsg("Reenter password: "),
            hidden: true,
            replace: '*',
            conform : CheckProcessExit,
            required: true,
        },
        address: {
            pattern: /^(0x)?[0-9a-fA-F]{40}$/,
            message: 'Address invalid!',
            description: Qmsg("Input address: "),
            conform : CheckProcessExit,
            required: true
        },
        waddress: {
            pattern: /^(0x)?[0-9a-fA-F]{132}$/,
            message: "Waddress invalid",
            description: Qmsg("Input waddress: "),
            conform : CheckProcessExit,
            required: true
        },
        YesNo: {
            pattern: /^y$|^Y$|^n$|^N$/,
            message: "you should input y(Y) or n(N)",
            description: Qmsg("Input: "),
            conform : CheckProcessExit,
            required: true
        },
        floatValue: {
            pattern: /^[+]{0,1}(\d+)$|^[+]{0,1}(\d+\.\d+)$/,
            message: "value invalid!",
            description: Qmsg("Input: "),
            conform : CheckProcessExit,
            required: true
        },
        intValue: {
            pattern: /^[1-9]\d*$/,
            message: "Value invalid!(you should input positive integer)",
            description: Qmsg("Input: "),
            conform : CheckProcessExit,
            required: true
        },
        gasLimit:{
            pattern: /^[1-9]\d*$/,
            message: "Invalid Gas limit",
            description: Qmsg("Input gas limit: "),
            conform : CheckProcessExit,
            required: true
        },
        gasPrice:{
            pattern: /^[1-9]\d*$/,
            message: "Price invalid!",
            description: Qmsg("Input gas price (Price limit is between 18Gwin-60Gwin): "),
            required: true,
            conform : function (value) {
                CheckProcessExit(value);
                return value>=18 && value<=60;
            }
        },
    }
};
function cloneSchema(Schema) {
    var newSchema = {};
    if (Schema instanceof Array) {
        newSchema = [];
    }
    for (var key in Schema) {
        var val = Schema[key];
        if(key == 'pattern')
        {
            newSchema[key] = val;
        }
        else
        {
            newSchema[key] = typeof val === 'object' ? cloneSchema(val): val;
        }
    }
    return newSchema;
};
function modifyDesc(Schema, desc,message) {
    Schema = cloneSchema(Schema);
    if(desc && desc.length>0) {
        Schema.description = Qmsg(desc);
    }
    if(message && message.length>0){
        Schema.message = message;
    }
    return Schema;
};
exports.keyPasswordSchema = {
    properties: {
        password: SchemaAll.properties.password,
        repeatPass: SchemaAll.properties.repeatPass
    }
};
exports.AccountNameSchema = function (desc,message) {
    let Schema = {
        properties:{}
    };
    Schema.properties.curaddress = modifyDesc(SchemaAll.properties.address,desc,message);
    return Schema;
};
exports.AccountSchema = function (desc,message,preLoad) {
    let Schema = {
        preLoad: preLoad,
        optionalArray:[],
        properties:{}
    };
    Schema.properties.AccountNo = modifyDesc(SchemaAll.properties.intValue,desc,message);
    return Schema;
};
exports.tokenSchema = function (desc,message,preLoad) {
    let Schema = {
        preLoad: preLoad,
        optionalArray:[],
        properties:{}
    };
    Schema.properties.tokenNo = modifyDesc(SchemaAll.properties.intValue,desc,message);
    return Schema;
};
exports.tokenAddress = function (desc,message) {
    let Schema = {
        properties:{}
    };
    Schema.properties.tokenAddress = modifyDesc(SchemaAll.properties.address,desc,message);
    return Schema;
};
exports.feeSchema = function (desc,message) {
    let Schema = {
        type: 'fee',
        optionalArray: ['Default', 'Advanced option'],
        properties: {}
    };
    Schema.properties.FeeSel = modifyDesc(SchemaAll.properties.intValue, desc, message);
    return Schema;
};
exports.feeInputSchema = function (desc,message) {
    let Schema = {
        properties: {}
    };
    Schema.properties.gasLimit = modifyDesc(SchemaAll.properties.gasLimit);
    Schema.properties.gasPrice = modifyDesc(SchemaAll.properties.gasPrice);
    return Schema;
};
exports.PasswordSchema = {
    properties: {
        password: SchemaAll.properties.password,
    }
};
exports.sendSchema = function () {
    let Schema = {
        properties:{}
    };
    Schema.properties.toaddress = modifyDesc(SchemaAll.properties.address,'Enter Recipient\'s address:','The address entered is invalid. ');
    Schema.properties.amount = modifyDesc(SchemaAll.properties.intValue, 'Enter transfer amount: ','The amount entered is invalid');
    return Schema;
};
exports.sendPrivacySchema = function () {
    let Schema = {
        properties:{}
    };
    Schema.properties.waddress = modifyDesc(SchemaAll.properties.waddress,'Input recipient p-address which is longer one for privacy transaction:',
        'The address entered is invalid. ');
//    Schema.properties.floatValue = modifyDesc(SchemaAll.properties.floatValue,'Input amount you want to send: ','The amount entered is invalid');
    return Schema;
};
exports.sendPrivacyAmount = function () {
    let Schema = {
        properties:{}
    };
    Schema.properties.PrivacyAmount = modifyDesc(SchemaAll.properties.intValue,'Input amount index you want to send by selecting value face:',
        'The number is invalid. ');
    Schema.optionalArray = [10,20,50,100,200,500,1000,5000,50000];
    return Schema;
};
exports.YesNoSchema = function (key,desc,message) {
    let Schema = {
        properties:{}
    };
    Schema.properties[key] = {
                pattern: /^y$|^Y$|^n$|^N$/,
                message: message,
                description: Qmsg(desc),
                conform:CheckProcessExit,
                required: true
            };
    return Schema;
};
exports.TransListSchema = function (desc,message,preLoad) {
    let Schema = {
        preLoad: preLoad,
        optionalArray:[],
        properties:{}
    };
    Schema.properties.TransNo = modifyDesc(SchemaAll.properties.intValue,desc,message);
    return Schema;
};
exports.OTASNameSchema = function (desc,message) {
    let Schema = {
        properties:{}
    };
    Schema.properties.OTAsadress = modifyDesc(SchemaAll.properties.waddress,desc,message);
    return Schema;
};

exports.OTAsListSchema = function (desc,message,preLoad) {
    let Schema = {
        preLoad: preLoad,
        optionalArray:[],
        properties:{}
    };
    Schema.properties.OTAsNo = modifyDesc(SchemaAll.properties.intValue,desc,message);
    return Schema;
};



