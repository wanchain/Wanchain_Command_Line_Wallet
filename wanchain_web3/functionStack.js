module.exports = class functionStack
{
    constructor() {
        this.bWait = false;
        this.haveASync = false;
        this.step = 0;
        this.functions = [];
        this.timeInv = null;
    }
    stepNext()
    {
        this.bWait = false;
    }
    run()
    {
        if(this.haveASync)
        {
            this.waitInfo(20);
        }
        this.callFunc();
    }
    callFunc() {
        let self = this;
        while(!self.bWait)
        {
            if(self.step<self.functions.length)
            {
                var funcParam = self.functions[self.step];
                self.bWait = funcParam.bASync;
                self.step++;
                funcParam.func(funcParam.owner);
            }
            else
            {
                if(self.haveASync && self.timeInv)
                {
                    clearInterval(self.timeInv);
                }
                break;
            }
        }
    }
    waitInfo(ms)
    {
        let self = this;
        self.timeInv = setInterval(function(){
            if(!self.bWait)
            {
                self.callFunc();
            }
        },ms);
    }
    //bASync is asynchronous flag
    addFunction(func,owner,bASync)
    {
        this.haveASync |= bASync;
        this.functions.push({func:func,owner:owner,bASync:bASync});
    }
}