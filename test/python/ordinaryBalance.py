import time

from send import *

test_name = "ordinaryBalance"

class OrdinaryBalance(Send):
    """ Class to test transaction list"""

    def __init__(self):
        super(OrdinaryBalance, self).__init__()
        self.tx_hash = ''

    def get_ordinary_balance(self):
        """ get transaction list details"""
        print sys._getframe().f_code.co_name + ": start"

        self.send_transaction()

        time.sleep(float(self.data['general']['balance sync sleep time']))
        child = pexpect.spawn('node ordinaryBalance --address ' + self.get_address(), cwd='../../src/');

        if commonUtil.show_logs:
            child.logfile = sys.stdout

        commonUtil.check_expect_condition(self.data['ordinaryBalance']['message'] + self.data['send']['amount'], child, test_name,
                                          "Balance not found", self.get_address())
        print sys._getframe().f_code.co_name + ": end"

def main():
    ordinaryBalance = OrdinaryBalance()
    print (" --------------- " + test_name + " start -------------")
    ordinaryBalance.get_ordinary_balance()
    commonUtil.test_successful(test_name)
    print (" --------------- " + test_name + " complete -------------")


if __name__ == "__main__":
    main()
    commonUtil.write_results()
