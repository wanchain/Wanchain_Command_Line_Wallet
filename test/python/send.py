import json
import sys

import pexpect
import commonUtil

from createKeystore import *

test_name = "send"
data = None

with open('../../util/test_data.json') as json_file:
    data = json.load(json_file)

class Send(CreateKeystore):
    """ Class to test send transaction """

    def __init__(self):
        self.tx_hash = ''

    def get_transaction_hash(self):
        return self.tx_hash

    def send_transaction(self):
        """ test send transaction"""

        self.create_wallet()

        child = pexpect.spawn('node send --address ' + data['wallet']['address']+
                              ' --toaddress ' + self.get_address()+
                              ' --amount '+ data['send']['amount']+
                              ' --FeeSel '+data['send']['fee_selection']+
                              ' --gasLimit '+ data['send']['gas_price']+
                              ' --gasPrice '+ data['send']['gas_limit']+
                              ' --submit ' + data['send']['submit']+
                              ' --password '+data['wallet']['password'], cwd='../../src/')
        if commonUtil.show_logs:
            child.logfile = sys.stdout

        child.expect(pexpect.EOF)
        result = child.before


        tx_start = -1
        summary = result.find(data['send']['txn message'])
        if(summary!= -1):
            tx_start = result.find('0x',summary)

        if(tx_start!=-1 & summary!=-1):
            self.tx_hash = result[tx_start:tx_start+66]
        else:
            commonUtil.exit_test('Transaction hash not found', test_name, child)

def main():
    send = Send()
    send.send_transaction()
    commonUtil.test_successful(test_name)


if __name__ == "__main__":
    main()
