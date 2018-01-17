import time

from tokenSend import *

test_name = "watchToken"
data = None

with open('../util/test_data.json') as json_file:
    data = json.load(json_file)


class WatchToken(TokenSend):
    """ Class to test transaction list"""

    def __init__(self):
        super(WatchToken, self).__init__()

    def get_token_balance(self):
        """ get transaction list details"""

        self.send_token_transaction()
        time.sleep(float(data['general']['balance sync sleep time']))
        child = pexpect.spawn('node watchToken --address ' + self.get_address() +
                              ' --tokenAddress ' + data['wallet']['token address'], cwd='../../src/');

        if commonUtil.show_logs:
            child.logfile = sys.stdout

        commonUtil.check_expect_condition(data['wallet']['token address'] + ")[\s\S]*(" + data['send']['amount'], child,
                                          test_name,
                                          "Balance not found")


def main():
    watchToken = WatchToken()
    watchToken.get_token_balance()
    commonUtil.test_successful(test_name)


if __name__ == "__main__":
    main()
    commonUtil.write_results()
