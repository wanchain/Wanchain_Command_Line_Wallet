import io
import json
import os
import random
import string
import sys
import subprocess
import pexpect
import createKeystore
import ordinaryBalance
import send
import sendPrivacy
import tokenSend
import transactionList
import watchToken
import sendTokenPrivacy

default_timeout = '120'
show_logs = True
status_title = 'status'
error_title = 'error_message'
skip_test = "Test skipped"


def get_random_string():
    return ''.join([random.choice(string.ascii_letters + string.digits) for n in xrange(16)])


def exit_test(error_message, test_name, process, address):
    data = {}
    data[test_name] = {status_title: 'failure', error_title: error_message}
    with open("temp.dat", "a+") as file:
        file.write(json.dumps(data) + "\n")
    write_results()
    cleanup(address)
    if process!= None:
        process.close()
    sys.exit(-1)


def test_successful(test_name):
    data = {}
    data[test_name] = {status_title: 'success'}
    with open("temp.dat", "a+") as file:
        file.write(json.dumps(data) + "\n")


def check_expect_condition(condition, process, test_name, failure_message, address):
    i = process.expect(['[\s\S]*(' + condition + ')[\s\S]*', pexpect.TIMEOUT, pexpect.EOF],
                       timeout=int(default_timeout))
    if i == 1:
        exit_test(
            "Request timed out. (No response for " + default_timeout + " seconds)", test_name, process, address)
    if i == 2:
        exit_test(failure_message, test_name, process, address)


def check_expect_eof(process, test_name, address):
    i = process.expect([pexpect.EOF, pexpect.TIMEOUT], timeout=int(default_timeout))
    if i == 1:
        exit_test("Request timed out. (No response for " + default_timeout + " seconds)", test_name, process, address)


def write_results(type="individual"):

    values = {}
    if type == "all":
        values = initialize_result()


    with open("temp.dat") as f:
        content = f.readlines()
    # remove whitespace characters like `\n` at the end of each line
    content = [x.strip() for x in content]

    for x in content:
        dict = json.loads(x)
        for key, value in dict.items():
            values[key] = value

    result = {}
    result["total_test_number"] = len(values)
    result["test_result"] = values
    print json.dumps(result, indent=4)

    with io.open('result.json', 'w', encoding='utf-8') as f:
        f.write(json.dumps(result, ensure_ascii=False, indent=4))

    os.remove("temp.dat")


def cleanup(address):
    with open('../util/test_data.json') as json_file:
        data = json.load(json_file)

    if address != "" and address!= None:
        subprocess.check_output("find " + data['general']['keystore path'] +" -name '*" + address[2:] + "*' -delete",
                                     shell=True)

def initialize_result():

    initial_values = {}
    initial_values[createKeystore.test_name] = {status_title: skip_test, error_title: "NA"}
    initial_values[ordinaryBalance.test_name] = {status_title: skip_test, error_title: "NA"}
    initial_values[send.test_name] = {status_title: skip_test, error_title: "NA"}
    initial_values[sendPrivacy.test_name] = {status_title: skip_test, error_title: "NA"}
    initial_values[sendTokenPrivacy.test_name] = {status_title: skip_test, error_title: "NA"}
    initial_values[tokenSend.test_name] = {status_title: skip_test, error_title: "NA"}
    initial_values[transactionList.test_name] = {status_title: skip_test, error_title: "NA"}
    initial_values[watchToken.test_name] = {status_title: skip_test, error_title: "NA"}

    return initial_values



def read_wallet_password(testname):
    with open('../util/test_data.json') as json_file:
        data = json.load(json_file)
    try:
        with open(os.path.expanduser(data['wallet']['password']), 'r') as f:
            password = f.readline()
            if(password == ""):
                exit_test("Test wallet password not found at path: " +data['wallet']['test data'],testname,None,"")
    except IOError:
        exit_test("Test wallet password file not present at path: " + data['wallet']['test data'], testname, None, "")
    return password