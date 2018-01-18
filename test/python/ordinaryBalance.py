import time

from send import *

test_name = "ordinaryBalance"
data = None

with open('../util/test_data.json') as json_file:
    data = json.load(json_file)


class OrdinaryBalance(Send):
    """ Class to test transaction list"""

    def __init__(self):
        super(OrdinaryBalance, self).__init__()
        self.tx_hash = ''

    def get_ordinary_balance(self):
        """ get transaction list details"""
        print sys._getframe().f_code.co_name + ": start"

        self.send_transaction()

        time.sleep(float(data['general']['balance sync sleep time']))
        child = pexpect.spawn('node ordinaryBalance --address ' + self.get_address(), cwd='../../src/');

        if commonUtil.show_logs:
            child.logfile = sys.stdout

        commonUtil.check_expect_condition(data['ordinaryBalance']['message'] + data['send']['amount'], child, test_name,
                                          "Balance not found")
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
