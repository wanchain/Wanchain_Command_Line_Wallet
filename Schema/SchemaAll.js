var colors = require("colors/safe");
var SchemaAll = {
    properties: {
        password: {
            pattern: '[^\u4e00-\u9fa5]+',
            message: "Password invalid or too short!",
            description: colors.magenta("Input password: "),
            hidden: true,
            replace: '*',
            required: true,
            conform : function (value) {
                var aaa = new String(value);
                return aaa.length>5;
            }
        },
        repeatPass:{
            pattern: '[^\u4e00-\u9fa5]+',
            message: "Password invalid",
            description: colors.magenta("repeat password: "),
            hidden: true,
            replace: '*',
            required: true,
        },
        address: {
            pattern: /^(0x)?[0-9a-fA-F]{40}$/,
            message: 'Address invalid!',
            description: colors.magenta("Input address: "),
            required: true
        },
        waddress: {
            pattern: /^(0x)?[0-9a-fA-F]{132}$/,
            message: "Waddress invalid",
            description: colors.magenta("Input waddress: "),
            required: true
        },
        YesNo: {
            pattern: /^y$|^Y$|^n$|^N$/,
            message: "you should input y(Y) or n(N)",
            description: colors.magenta("Input: "),
            required: true
        },
        floatValue: {
            pattern: /^[+]{0,1}(\d+)$|^[+]{0,1}(\d+\.\d+)$/,
            message: "value invalid!",
            description: colors.magenta("Input: "),
            required: true
        },
        intValue: {
            pattern: /^[1-9]\d*$/,
            message: "Value invalid!(you should input positive integer)",
            description: colors.magenta("Input: "),
            required: true
        },
        gasLimit:{
            pattern: /^[1-9]\d*$/,
            message: "Gas limit invalid!",
            description: colors.magenta("Input gas limit: "),
            required: true
        },
        gasPrice:{
            pattern: /^[1-9]\d*$/,
            message: "Price invalid!",
            description: colors.magenta("Input gas price (Price limit is between 1win-60win): "),
            required: true,
            conform : function (value) {
                return value>=1 && value<=60;
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
        Schema.description = colors.magenta(desc);
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
exports.AccountSchema = function (desc,message,preLoad) {
    let Schema = {
        preLoad: preLoad,
        properties:{}
    };
    Schema.properties.AccountNo = modifyDesc(SchemaAll.properties.intValue,desc,message);
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
    Schema.properties.toaddress = modifyDesc(SchemaAll.properties.address,'Input recipient address:','The address inputted is invalid. ');
    Schema.properties.amount = modifyDesc(SchemaAll.properties.intValue, 'Input amount you want to send: ','The amount inputted is invalid');
    return Schema;
};
exports.sendPrivacySchema = function () {
    let Schema = {
        properties:{}
    };
    Schema.properties.waddress = modifyDesc(SchemaAll.properties.waddress,'Input recipient p-address which is longer one for privacy transaction:',
        'The address inputted is invalid. ');
//    Schema.properties.floatValue = modifyDesc(SchemaAll.properties.floatValue,'Input amount you want to send: ','The amount inputted is invalid');
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
                description: colors.magenta(desc),
                required: true
            };
    return Schema;
};
exports.TransListSchema = function (desc,message,preLoad) {
    let Schema = {
        preLoad: preLoad,
        properties:{}
    };
    Schema.properties.TransNo = modifyDesc(SchemaAll.properties.intValue,desc,message);
    return Schema;
};



