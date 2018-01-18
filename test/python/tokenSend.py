from createKeystore import *

test_name = "tokensend"
data = None

with open('../util/test_data.json') as json_file:
    data = json.load(json_file)


class TokenSend(CreateKeystore):
    """ Class to test send token transaction """

    def __init__(self):
        super(TokenSend, self).__init__()
        self.tx_hash = ''

    def get_token_transaction_hash(self):
        return self.tx_hash

    def send_token_transaction(self):
        """ test token send transaction"""

        print sys._getframe().f_code.co_name + ": start"
        self.create_wallet()


        child = pexpect.spawn('node tokensend --address ' + data['wallet']['address'] +
                              ' --tokenAddress 1 '+
                              ' --toaddress ' + self.get_address() +
                              ' --amount ' + data['send']['amount'] +
                              ' --FeeSel ' + data['send']['fee_selection'] +
                              ' --gasLimit ' + data['send']['gas_price'] +
                              ' --gasPrice ' + data['send']['gas_limit'] +
                              ' --submit ' + data['send']['submit'] +
                              ' --password ' + data['wallet']['password'], cwd='../../src/')
        if commonUtil.show_logs:
            child.logfile = sys.stdout

        commonUtil.check_expect_eof(child, test_name)

        result = child.before

        tx_start = -1
        summary = result.find(data['send']['txn_message'])
        if (summary != -1):
            tx_start = result.find('0x', summary)

        if (tx_start != -1 & summary != -1):
            self.tx_hash = result[tx_start:tx_start + 66]
        else:
            commonUtil.exit_test('Transaction hash not found', test_name, child)

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
