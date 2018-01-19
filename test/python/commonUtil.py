import io
import json
import os
import random
import string
import sys
import subprocess

import pexpect

default_timeout = '120'
show_logs = True
status_title = 'status'
error_title = 'error_message'



def get_random_string():
    return ''.join([random.choice(string.ascii_letters + string.digits) for n in xrange(16)])


def exit_test(error_message, test_name, process, address):
    data = {}
    data[test_name] = {status_title: 'failure', error_title: error_message}
    with open("temp.dat", "a+") as file:
        file.write(json.dumps(data) + "\n")
    write_results()
    cleanup(address)
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


def write_results():
    with open("temp.dat") as f:
        content = f.readlines()

    # remove whitespace characters like `\n` at the end of each line
    content = [x.strip() for x in content]

    values = {}
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
    subprocess.check_output("find " + data['general']['keystore path'] +" -name '*" + address[2:] + "*' -delete",
                                     shell=True)