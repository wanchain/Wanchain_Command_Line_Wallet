import time

from send import *

test_name = "sendPrivacy"

class SendPrivacy(Send):
    """ Class to test send privacy transaction """

    def __init__(self):
        super(SendPrivacy, self).__init__()
        self.tx_hash = ''
        self.ota = ''

    def send_privacy_transaction(self):
        """ test send privacy transaction"""

        print sys._getframe().f_code.co_name + ": start"
        # create a wallet with balance
        self.send_transaction()

        print 'node sendPrivacy --address 1' + \
                              ' --waddress ' + self.get_wan_address() + \
                              ' --PrivacyAmount ' + self.data['send']['amount'] + \
                              ' --FeeSel ' + self.data['send']['fee selection'] + \
                              ' --gasLimit ' + self.data['send']['gas limit'] + \
                              ' --gasPrice ' + self.data['send']['gas price'] + \
                              ' --submit ' + self.data['send']['submit'] + \
                              ' --password ' + commonUtil.read_wallet_password(test_name)
        # Start privacy transaction
        child = pexpect.spawn('node sendPrivacy --address 1' +
                              ' --waddress ' + self.get_wan_address() +
                              ' --PrivacyAmount ' + self.data['send']['amount'] +
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



        # Transaction successful, now wait for block to get scanned
        print "send a privacy transaction"
        time.sleep(int(self.data['send privacy']['fetch OTA wait time']))

        child = pexpect.spawn('node fetchMyOTA --address ' + self.get_address() +
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
            self.ota = result[ota_start:ota_start + 134]
        else:
            commonUtil.exit_test('OTA not found', test_name, child, self.get_address())

        # OTA fetched, now start refund process
        print "send refundOTA transaction"
        child = pexpect.spawn('node refundOTAs --address ' + self.address +
                              ' --OTAaddress ' + self.ota +
                              ' --FeeSel ' + self.data['send']['fee selection'] +
                              ' --gasLimit ' + self.data['send']['gas limit'] +
                              ' --gasPrice ' + self.data['send']['gas price'] +
                              ' --submit ' + self.data['send']['submit'] +
                              ' --password ' + self.get_password(), cwd='../../src/')
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

        time.sleep(int(self.data['general']['balance sync sleep time']))

        # Confirm the balance
        print "send ordinaryBalance transaction"
        child = pexpect.spawn('node ordinaryBalance --address ' + self.get_address(),
                              cwd='../../src/');

        if commonUtil.show_logs:
            child.logfile = sys.stdout

        commonUtil.check_expect_eof(child, test_name, self.get_address())

        result = child.before

        message_start = result.find(self.data['ordinaryBalance']['message'])

        # The balance should be more than starting balance before privacy transaction
        # Can't predict exact balance as fees get deducted in refundOTA process
        #if (float(result[message_start + len(self.data['ordinaryBalance']['message']):]) <= float(self.data['send']['amount'])):
        print 'Balance is %s' % float(result[message_start + len(self.data['ordinaryBalance']['message']):])
        if (float(result[message_start + len(self.data['ordinaryBalance']['message']):]) <= 10):
            commonUtil.exit_test('Balance not updated', test_name, child, self.get_address())

        print sys._getframe().f_code.co_name + ": end"

def main():
    sendPrivacy = SendPrivacy()
    print (" --------------- " + test_name + " start -------------")
    sendPrivacy.send_privacy_transaction()
    commonUtil.test_successful(test_name)
    print (" --------------- " + test_name + " complete -------------")


if __name__ == "__main__":
    main()
    commonUtil.write_results()
