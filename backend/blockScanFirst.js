let contractParam = require('../wanchain_web3/contractTransParam.js')
process.on('message', function(m) {
    let result = {
        token:[],
        privacy:[]
    };
    for(var i=0;i<m.tx.length;i++)
    {
        var item = m.tx[i];
        if(contractParam.isTokenOTA(item))
        {
            /*
            let param = contractParam.parseContractTokenOTA(item.input);
            if(param)
            {
                let input = param.CxtCallParams;
                if(contractParam.isOTATransfer(input))
                {
                    let param = contractParam.parseContractOTATransfer(input);
                    if(param){
                        console.log(param);
                        result.token.push([param._to,param._toKey, item.to,param._value,
                            item.from,m.time, m.number,item.hash]);
                    }
                }
            }
            */
        }
        else if(contractParam.isPrivacyOTA(item))
        {
            let param = contractParam.parsePrivacyOTA(item.input);
            if(param)
            {
                result.privacy.push([param.OtaAddr, item.value, m.time, item.from,  m.number,item.hash]);
            }
        }
    }
    process.send(result);
});
//process.send({ foo: 'fist bar' });