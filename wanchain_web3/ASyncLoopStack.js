module.exports = class ASyncLoopStack
{
    constructor(RNum,WaitS) {
        this.RNum = RNum || 3;
        this.WaitS = WaitS || 5;
        this.iter = 0;
        this.sucess = 0;
        this.Array = [];
        this.range = null;
        this.timeInv = null;
        this.EachFunc = null;
        this.EndFunc = null;
        this.param = null;
    }
    stepNext()
    {
        ++this.sucess;
    }
    isArrayLength()
    {
        if(this.range)
            return this.range[1] - this.range[0];
        else
            return this.Array.length;
    }
    isInRange(iter)
    {
        if(this.range)
            return iter<this.range[1];
        else
            return iter<this.Array.length;
    }
    run()
    {
        if(this.range)
        {
            this.iter = this.range[0];
            this.sucess = this.iter;
        }
        if(this.isInRange(this.iter) && this.EachFunc)
        {
            this.waitInfo(this.WaitS);
            this.callFunc();
        }
    }
    callFunc() {
        while(this.iter - this.sucess<this.RNum && this.isInRange(this.iter))
        {
            var index = this.iter;
            ++this.iter;
            if(this.range)
                this.EachFunc(this.param,null,index);
            else
                this.EachFunc(this.param,this.Array[index],index);
        }
    }
    waitInfo(ms)
    {
        let self = this;
        self.timeInv = setInterval(function(){
            if(self.iter - self.sucess<self.RNum && self.isInRange(self.iter))
            {
                self.callFunc();
            }
            else if(!self.isInRange(self.sucess))
            {
                clearInterval(self.timeInv);
                self.timeInv = 0;
                if(self.EndFunc)
                {
                    self.EndFunc(self.param);
                }

            }
        },ms);
    }

}