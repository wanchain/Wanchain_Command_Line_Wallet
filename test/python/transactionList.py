from send import *
from tokenSend import *

test_name = "transactionList"

class TransactionList(Send):
    """ Class to test transaction list"""

    def __init__(self):
        super(TransactionList, self).__init__()
        self.tx_hash = ''

    def get_transaction_list(self):
        """ get transaction list details"""

        print sys._getframe().f_code.co_name + ": start"
        self.send_transaction()
        child = pexpect.spawn('node transactionList --address 1' +
                              ' --transHash ' + self.get_transaction_hash(), cwd='../../src/');

        if commonUtil.show_logs:
            child.logfile = sys.stdout


        commonUtil.check_expect_condition(self.get_transaction_hash(), child, test_name,
                                          "Regular transaction's hash not found in the result", self.get_address())

        print sys._getframe().f_code.co_name + ": end"


def main():
    tranasactionList = TransactionList()
    print (" --------------- " + test_name + " start -------------")
    tranasactionList.get_transaction_list()

    commonUtil.test_successful(test_name)
    print (" --------------- " + test_name + " complete -------------")


if __name__ == "__main__":
    main()
    commonUtil.write_results()
