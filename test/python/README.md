# Requirements:

- Install Python
- Install python package: pexpect (follow instruction here: http://www.pythonforbeginners.com/systems-programming/how-to-use-the-pexpect-module-in-python)

# Test Parameters
- common test parameters are stored in util/data.json file
- Update following parameters to start testing. The wallet must have enough balance to run tests
    
    ```
    {
 		"address": "",
 		"password": ""
 	} 

# Execute Test:

Run following commands execute test cases.
- python createKeystore.py
- python send.py
- python transactionList.py
- python ordinaryBalance.py
- python sendPrivacy.py (Run cd backend && node wanChainBlockScan.js beforehand)

# Run all test cases
- python testAll.

# Check Result
- Results are stored in results.json after every test run. It will be overwritten if new test is run. 


# Show console log
- Go to commonUtil.py
- change ```show_logs = True```
