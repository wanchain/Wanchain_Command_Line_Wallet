# Requirements:

- Install Python 2.7
- Install python package: pexpect (follow instruction here: http://www.pythonforbeginners.com/systems-programming/how-to-use-the-pexpect-module-in-python)

# Test Parameters
- common test parameters are stored in test/util/data.json file
- Tests will use below details to performa all functions. Update following parameters to start testing. 
    
    ```
    {
 		"address": Make sure this wallet with wan, token and privacy token balance
 		"password": "~/.wanchain/cli_test_account_passwd" #store password of above wallet on this path
 		"token address" : The token and privacy token contract address
 	} 

# Execute Test:
- <b> Before you execute test make sure above test parameters are set correctly. Run following commands execute test cases. </b>
- python createKeystore.py   
	- It will test create wallet function 
- python send.py     
	- it will test send WAN function
- python ordinaryBalance.py 
	- It will test send a transaction and test show WAN balance function
- python tokenSend 
	- It will test send token function
- python watchToken.py 
	- It will send a token transaction and test show token balance function
- python transactionList.py 
	- It will send a WAN and a token transaction then test show transction list function 
- python sendPrivacy.py 
	- It will test send privacy transaction, fetch OTA, refund OTA and show balance functions
- python sendTokenPrivacy.py 
	- It will test token buy stamp, send token privacy transaction, fetch token OTA and watch token OTA functions 

# Run all test cases
- python testAll 

# Check Result
- Results are stored in results.json after every test run. It will be overwritten if new test is run. 


# Show CLI console log
- Go to commonUtil.py
- change ```show_logs = True```

