from send import *
from tokenSend import *

test_name = "transactionList"
data = None

with open('../util/test_data.json') as json_file:
    data = json.load(json_file)


class TransactionList(Send, TokenSend):
    """ Class to test transaction list"""

    def __init__(self):
        super(TransactionList, self).__init__()
        self.tx_hash = ''

    def get_transaction_list(self):
        """ get transaction list details"""

        self.send_transaction()
        child = pexpect.spawn('node transactionList --address ' + data['wallet']['address'] +
                              ' --transHash ' + self.get_transaction_hash(), cwd='../../src/');

        if commonUtil.show_logs:
            child.logfile = sys.stdout

        commonUtil.check_expect_condition(self.get_transaction_hash(), child, test_name,
                                          "Regular transaction's hash not found in the result")

        self.send_token_transaction()
        child = pexpect.spawn('node transactionList --address ' + data['wallet']['address'] +
                              ' --transHash ' + self.get_transaction_hash(), cwd='../../src/');

        if commonUtil.show_logs:
            child.logfile = sys.stdout

        commonUtil.check_expect_condition(self.get_token_transaction_hash() + ")[\s\S]*(" + '"Type":"token"', child,
                                          test_name,
                                          "Token transaction summary mismatch")


def main():
    tranasactionList = TransactionList()
    tranasactionList.get_transaction_list()
    commonUtil.test_successful(test_name)


if __name__ == "__main__":
    main()
    commonUtil.write_results()
