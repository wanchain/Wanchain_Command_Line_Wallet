import json
import sys

import pexpect

import commonUtil

test_name = "createKeystore"


class CreateKeystore(object):
    """ Class to test create wallet operation """

    def __init__(self):
        self.address = ''
        self.waddress = ''
        self.file_name = ''
        self.password = ''

    def get_address(self):
        return self.address

    def get_wan_address(self):
        return self.waddress

    def get_password(self):
        return self.password

    def create_wallet(self):
        """ test create wallet operation"""

        with open('../util/test_data.json') as json_file:
            data = json.load(json_file)

        self.password = commonUtil.get_random_string()
        print self.password
        child = pexpect.spawn('node createKeystore --password ' + self.password+' --repeatPass ' + self.password, cwd='../../src/')
        if commonUtil.show_logs:
            child.logfile = sys.stdout

        commonUtil.check_expect_eof(child,test_name)


        result = child.before
        address_start = result.find('0x')
        if address_start == -1:
            commonUtil.exit_test('address value not found', test_name,child)
        self.address = result[address_start:address_start + 42]


        waddress_start = result.find(data["createKeystore"]["waddress"], address_start + 42)
        if waddress_start == -1:
            commonUtil.exit_test('wan address title/value not found', test_name,child)
        self.waddress = result[waddress_start+10:waddress_start + 144]








def main():
    createKeystore = CreateKeystore()
    createKeystore.create_wallet()
    commonUtil.test_successful(test_name)


if __name__ == "__main__":
    main()
    commonUtil.write_results()