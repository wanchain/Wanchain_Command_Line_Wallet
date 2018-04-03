import time

from send import *

test_name = "sendTokenPrivacy"
data = None

with open('../util/test_data.json') as json_file:
    data = json.load(json_file)


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
                              ' --FeeSel ' + data['send']['fee selection'] +
                              ' --gasLimit ' + data['send']['gas limit'] +
                              ' --gasPrice ' + data['send']['gas price'] +
                              ' --submit ' + data['send']['submit'] +
                              ' --password ' + commonUtil.read_wallet_password(test_name), cwd='../../src/')
        if commonUtil.show_logs:
             child.logfile = sys.stdout
        commonUtil.check_expect_eof(child, test_name, self.get_address())
        print "tokenBuyStamp end"

        # to sync the stamp
        time.sleep(float(data['general']['balance sync sleep time']))

        # create a wallet with balance
        self.send_transaction()



        print "watchTokenOTA start"
        child = pexpect.spawn('node watchTokenOTA --address ' + self.get_address() +
                              ' --tokenAddress ' + data['wallet']['token address'] +
                              ' --OTAAddress ' + '0x02529bdb23df2f1f6730a960da4b8cacd027037f8581697651eb9b8c9667549400033baad5a5b1aae530ed86235f2182fb8a4e9caabc939e622a97641e9a415b6f0f', cwd='../../src/')

        if commonUtil.show_logs:
            child.logfile = sys.stdout

        commonUtil.check_expect_condition(data['wallet']['token address'] + ")[\s\S]*(" + data['send']['amount'],
                                          child,
                                          test_name,
                                          "Balance not found", self.get_address())
        print "watchTokenOTA end"



        #Init privacy token asset
        #print 'initPrivacyAsset start'
        #child = pexpect.spawn('node initPrivacyAsset --address ' + data['wallet']['address'] +
        #                      ' --tokenAddress ' + data['wallet']['token address'] +
        #                      ' --FeeSel ' + data['send']['fee selection'] +
        #                      ' --gasLimit ' + data['send']['gas limit'] +
        #                      ' --gasPrice ' + data['send']['gas price'] +
        #                      ' --submit ' + data['send']['submit'] +
        #                      ' --password ' + commonUtil.read_wallet_password(test_name), cwd='../')        

        #if commonUtil.show_logs:
        #    child.logfile = sys.stdout

        #commonUtil.check_expect_condition('Transaction hash:', child,
        #                                  test_name,
        #                                  "initPrivacyAsset failed", self.get_address())

        #print 'initPrivacyAsset end'

        # Start privacy transaction
        print "tokenSendPrivacy start"
        child = pexpect.spawn('node tokenSendPrivacy --address 1' +
                              ' --contractBalance 1' +
                              ' --waddress ' + self.get_wan_address() +
                              ' --amount ' + data['send']['amount']
                              , cwd='../../src/')

        if commonUtil.show_logs:
             child.logfile = sys.stdout

        commonUtil.check_expect_condition("Input stamp OTA you want to us", child, test_name, "tokenSendPrivacy failed", self.get_address())
        result = child.after
        count = str(result.count("status"))

        child = pexpect.spawn('node tokenSendPrivacy --address 1' +
                              ' --contractBalance 1' +
                              ' --waddress ' + self.get_wan_address() +
                              ' --amount ' + data['send']['amount'] +
                              ' --stampOTA ' + count +
                              ' --submit ' + data['send']['submit'] +
                              ' --password ' + commonUtil.read_wallet_password(test_name), cwd='../../src/')
        if commonUtil.show_logs:
             child.logfile = sys.stdout
        commonUtil.check_expect_condition(data['send']['txn message'], child, test_name,
                                          "Transaction hash not found", self.get_address())
        print "tokenSendPrivacy end"



        # Transaction successful, now wait for block to get scanned
        time.sleep(int(data['send privacy']['fetch OTA wait time']))
        print "fetchTokenOTA start"
        child = pexpect.spawn('node fetchTokenOTA --address ' + self.get_address() +
                              ' --password ' + self.get_password(), cwd='../../src/')

        if commonUtil.show_logs:
            child.logfile = sys.stdout

        commonUtil.check_expect_eof(child, test_name, self.get_address())

        result = child.before
        summary = result.find(data['fetchOTA']['ota message'])
        ota_start = ''
        if (summary != -1):
            ota_start = result.find('0x', summary)

        if (ota_start != -1 & summary != -1):
            self.token_ota = result[ota_start:ota_start + 134]
        else:
            commonUtil.exit_test('OTA not found', test_name, child, self.get_address())
        print "fetchTokenOTA end"




        time.sleep(float(data['general']['balance sync sleep time']))
        print "watchTokenOTA start"
        child = pexpect.spawn('node watchTokenOTA --address ' + self.get_address() +
                              ' --tokenAddress ' + data['wallet']['token address'] +
                              ' --OTAAddress ' + self.token_ota, cwd='../../src/')

        if commonUtil.show_logs:
            child.logfile = sys.stdout

        commonUtil.check_expect_condition(data['wallet']['token address'] + ")[\s\S]*(" + data['send']['amount'],
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
