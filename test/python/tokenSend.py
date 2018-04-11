from createKeystore import *

test_name = "tokensend"

class TokenSend(CreateKeystore):
    """ Class to test send token transaction """

    def __init__(self):
        super(TokenSend, self).__init__()
        self.tx_hash = ''
        with open('../util/test_data.json', 'r') as json_file:
            self.data = json.load(json_file)        

    def get_token_transaction_hash(self):
        return self.tx_hash

    def send_token_transaction(self):
        """ test token send transaction"""

        print sys._getframe().f_code.co_name + ": start"


        # This is to make sure our wallet's token balance is synced
        print "watch token start"
        child = pexpect.spawn('node watchToken --address 1' +
                              ' --tokenAddress ' + self.data['wallet']['token address'], cwd='../../src/');

        if commonUtil.show_logs:
            child.logfile = sys.stdout

        commonUtil.check_expect_condition(self.data['wallet']['token address'], child,
                                          test_name,
                                          "Watch token failed for source address", self.get_address())
        print "watch token end"

        self.create_wallet()

        child = pexpect.spawn('node tokensend --address 1' +
                              ' --tokenAddress 1 '+
                              ' --toaddress ' + self.get_address() +
                              ' --amount ' + self.data['send']['amount'] +
                              ' --FeeSel ' + self.data['send']['fee selection'] +
                              ' --gasLimit ' + self.data['send']['gas limit'] +
                              ' --gasPrice ' + self.data['send']['gas price'] +
                              ' --submit ' + self.data['send']['submit'] +
                              ' --password ' + commonUtil.read_wallet_password(test_name), cwd='../../src/')
        if commonUtil.show_logs:
            child.logfile = sys.stdout

        commonUtil.check_expect_eof(child, test_name, self.get_address())

        result = child.before

        tx_start = -1
        summary = result.find(self.data['send']['txn message'])
        if (summary != -1):
            tx_start = result.find('0x', summary)

        if (tx_start != -1 & summary != -1):
            self.tx_hash = result[tx_start:tx_start + 66]
        else:
            commonUtil.exit_test('Transaction hash not found', test_name, child, self.get_address())

        print sys._getframe().f_code.co_name + ": end"

def main():
    tokenSend = TokenSend()
    print (" --------------- " + test_name + " start -------------")
    tokenSend.send_token_transaction()
    commonUtil.test_successful(test_name)
    print (" --------------- " + test_name + " complete -------------")


if __name__ == "__main__":
    main()
    commonUtil.write_results()
