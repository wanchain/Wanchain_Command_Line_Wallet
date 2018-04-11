import time

from send import *

test_name = "sendTokenPrivacy"

class SendTokenPrivacy(Send):
    """ Class to test send privacy transaction """

    def __init__(self):
        super(SendTokenPrivacy, self).__init__()
        self.tx_hash = ''
        self.token_ota = ''

    def send_token_privacy_transaction(self):
        """ test send privacy transaction"""

        print sys._getframe().f_code.co_name + ": start"

        print "tokenBuyStamp start"
        child = pexpect.spawn('node tokenBuyStamp --address 1' +
                              ' --stampBalance 1' +
                              ' --FeeSel ' + self.data['send']['fee selection'] +
                              ' --gasLimit ' + self.data['send']['gas limit'] +
                              ' --gasPrice ' + self.data['send']['gas price'] +
                              ' --submit ' + self.data['send']['submit'] +
                              ' --password ' + commonUtil.read_wallet_password(test_name), cwd='../../src/')
        if commonUtil.show_logs:
             child.logfile = sys.stdout
        commonUtil.check_expect_eof(child, test_name, self.get_address())
        print "tokenBuyStamp end"

        # to sync the stamp
        time.sleep(float(self.data['general']['balance sync sleep time']))

        # create a wallet with balance
        self.send_transaction()


        print "watchTokenOTA start"
        child = pexpect.spawn('node watchTokenOTA --address ' + self.get_address() +
                              ' --tokenAddress ' + self.data['wallet']['token address'] +
                              ' --OTAAddress ' + self.data['wallet']['token_ota'],  cwd='../../src/')

        if commonUtil.show_logs:
            child.logfile = sys.stdout

        commonUtil.check_expect_condition('add new token balance',
                                          child,
                                          test_name,
                                          "Balance not found", self.get_address())
        print "watchTokenOTA end"



        #Init privacy token asset
        #print 'initPrivacyAsset start'
        #child = pexpect.spawn('node initPrivacyAsset --address ' + self.data['wallet']['address'] +
        #                      ' --tokenAddress ' + self.data['wallet']['token address'] +
        #                      ' --FeeSel ' + self.data['send']['fee selection'] +
        #                      ' --gasLimit ' + self.data['send']['gas limit'] +
        #                      ' --gasPrice ' + self.data['send']['gas price'] +
        #                      ' --submit ' + self.data['send']['submit'] +
        #                      ' --password ' + commonUtil.read_wallet_password(test_name), cwd='../')        

        #if commonUtil.show_logs:
        #    child.logfile = sys.stdout

        #commonUtil.check_expect_condition('Transaction hash:', child,
        #                                  test_name,
        #                                  "initPrivacyAsset failed", self.get_address())

        #print 'initPrivacyAsset end'

        # Start privacy transaction
        child = pexpect.spawn('node tokenSendPrivacy --address 1' +
                              ' --contractBalance 1' +
                              ' --waddress ' + self.get_wan_address() +
                              ' --amount ' + self.data['send']['amount'] +
                              ' --stampOTA 1' +
                              ' --submit ' + self.data['send']['submit'] +
                              ' --password ' + commonUtil.read_wallet_password(test_name), cwd='../../src/')
        if commonUtil.show_logs:
             child.logfile = sys.stdout
        commonUtil.check_expect_condition(self.data['send']['txn message'], child, test_name,
                                          "Transaction hash not found", self.get_address())
        print "tokenSendPrivacy end"



        # Transaction successful, now wait for block to get scanned
        time.sleep(int(self.data['send privacy']['fetch OTA wait time']))
        print "fetchTokenOTA start"
        child = pexpect.spawn('node fetchTokenOTA --address ' + self.get_address() +
                              ' --password ' + self.get_password(), cwd='../../src/')

        if commonUtil.show_logs:
            child.logfile = sys.stdout

        commonUtil.check_expect_eof(child, test_name, self.get_address())

        result = child.before
        summary = result.find(self.data['fetchOTA']['ota message'])
        ota_start = ''
        if (summary != -1):
            ota_start = result.find('0x', summary)

        if (ota_start != -1 & summary != -1):
            self.token_ota = result[ota_start:ota_start + 134]
        else:
            commonUtil.exit_test('OTA not found', test_name, child, self.get_address())
        print "fetchTokenOTA end"




        time.sleep(float(self.data['general']['balance sync sleep time']))
        print "watchTokenOTA start"
        child = pexpect.spawn('node watchTokenOTA --address ' + self.get_address() +
                              ' --tokenAddress ' + self.data['wallet']['token address'] +
                              ' --OTAAddress ' + self.token_ota, cwd='../../src/')

        if commonUtil.show_logs:
            child.logfile = sys.stdout

        commonUtil.check_expect_condition(self.data['wallet']['token address'] + ")[\s\S]*(" + self.data['send']['amount'],
                                          child,
                                          test_name,
                                          "Balance not found", self.get_address())
        print "watchTokenOTA end"


        print sys._getframe().f_code.co_name + ": end"

def main():
    sendTokenPrivacy = SendTokenPrivacy()
    print (" --------------- " + test_name + " start -------------")
    sendTokenPrivacy.send_token_privacy_transaction()
    commonUtil.test_successful(test_name)
    print (" --------------- " + test_name + " complete -------------")


if __name__ == "__main__":
    main()
    commonUtil.write_results()
