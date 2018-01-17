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

        self.create_wallet()

        child = pexpect.spawn('node tokensend --address ' + data['wallet']['address'] +
                              ' --tokenAddress ' + data['wallet']['token address'] +
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


def main():
    tokenSend = TokenSend()
    tokenSend.send_token_transaction()
    commonUtil.test_successful(test_name)


if __name__ == "__main__":
    main()
    commonUtil.write_results()
