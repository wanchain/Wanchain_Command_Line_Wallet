import time

from send import *

test_name = "sendPrivacy"
data = None

with open('../util/test_data.json') as json_file:
    data = json.load(json_file)


class SendPrivacy(Send):
    """ Class to test send privacy transaction """

    def __init__(self):
        super(SendPrivacy, self).__init__()
        self.tx_hash = ''
        self.ota = ''

    def send_privacy_transaction(self):
        """ test send privacy transaction"""

        # create a wallet with balance
        self.send_transaction()

        # Start privacy transaction
        child = pexpect.spawn('node sendPrivacy --address ' + data['wallet']['address'] +
                              ' --waddress ' + self.get_wan_address() +
                              ' --PrivacyAmount ' + data['send']['amount'] +
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

        # Transaction successful, now wait for block to get scanned
        time.sleep(int(data['send privacy']['fetch OTA wait time']))

        child = pexpect.spawn('node fetchMyOTA --address ' + self.get_address() +
                              ' --password ' + self.get_password(), cwd='../../src/')

        if commonUtil.show_logs:
            child.logfile = sys.stdout

        commonUtil.check_expect_eof(child, test_name)

        result = child.before
        summary = result.find(data['fetchOTA']['ota_message'])
        ota_start = ''
        if (summary != -1):
            ota_start = result.find('0x', summary)

        if (ota_start != -1 & summary != -1):
            self.ota = result[ota_start:ota_start + 134]
        else:
            commonUtil.exit_test('OTA not found', test_name, child)

        # OTA fetched, now start refund process
        child = pexpect.spawn('node refundOTAs --address ' + self.address +
                              ' --OTAaddress ' + self.ota +
                              ' --FeeSel ' + data['send']['fee_selection'] +
                              ' --gasLimit ' + data['send']['gas_price'] +
                              ' --gasPrice ' + data['send']['gas_limit'] +
                              ' --submit ' + data['send']['submit'] +
                              ' --password ' + self.get_password(), cwd='../../src/')
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

        time.sleep(int(data['general']['default sleep time']))

        # Confirm the balance
        child = pexpect.spawn('node ordinaryBalance --address ' + self.get_address(),
                              cwd='../../src/');

        if commonUtil.show_logs:
            child.logfile = sys.stdout

        commonUtil.check_expect_eof(child, test_name)

        result = child.before

        message_start = result.find(data['ordinaryBalance']['message'])

        # The balance should be more than starting balance before privacy transaction
        # Can't predict exact balance as fees get deducted in refundOTA process
        if (float(result[message_start + len(data['ordinaryBalance']['message']):]) <= float(data['send']['amount'])):
            commonUtil.exit_test('Balance not updated', test_name, child)


def main():
    sendPrivacy = SendPrivacy()
    sendPrivacy.send_privacy_transaction()
    commonUtil.test_successful(test_name)


if __name__ == "__main__":
    main()
    commonUtil.write_results()
