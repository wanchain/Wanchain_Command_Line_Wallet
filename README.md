# Wanchain_Command_Line_Wallet

## How to use Wanchain Command Line Wallet

### run in windows x64
- download latest version of `win_geth.zip` from https://github.com/wanchain/go-wanchain/releases/
- unzip and run `geth.exe`
- download latest version of `wanchainclient_cli_win64.zip` from https://github.com/wanchain/go-wanchain/releases/
- unzip and run `wanchain_client.cmd`

### run in linux or mac
- Supported Env: `node v8+`
- download lateset version of `linux_geth.tar.gz` from https://github.com/wanchain/go-wanchain/releases/
- unzip and run `geth.exe`

### Install node packages
    $ git clone https://github.com/wanchain/Wanchain_Command_Line_Wallet.git
    $ cd Wanchain_Command_Line_Wallet 
    $ npm install
    
### Select Wanchain network
- Run `geth.exe` with network parameter
- Modify `wanchainNet` value in config.js


### If you want fetch OTAs, please run the following command based on your OS env to Scan OTAs in new terminal first.
#### run in windows x64
    $ cd backend 
    $ node wanChainBlockScan.js
#### run in linux or mac
    $ cd backend 
    $ node wanChainBlockScan.js

### run Wanchain Command Line Wallet in src dir

    $ cd src

### Executing commands
#### Run each `*.js` file as `node *.js or node <filename> without .js` in command line. 
#### For example,

    $ node createKeystore.js
    or
    $ node createKeystore

Supports command line input parameters and default input parameter 'Q' or 'q' to exit the process. 

### List of supported commands

| File          | Purpose       |   Parameters  |  Command  |
| ------------- | ------------- |-------------|---------|
| createKeystore.js | create new account | `--password  --repeatPass` | ```node createKeystore.js --password  --repeatPass```|
| send.js | send a transaction | `--address  --toaddress --amount --FeeSel  --gasLimit --gasPrice --submit --password` | ```node send.js --address  --toaddress --amount --FeeSel  --gasLimit --gasPrice --submit --password```|
| sendPrivacy.js | send with privacy | `--address  --waddress --PrivacyAmount --FeeSel  --gasLimit --gasPrice --submit --password` | ```node sendPrivacy.js --address  --waddress --PrivacyAmount --FeeSel  --gasLimit --gasPrice --submit --password```|
| transactionList.js | Print transaction list and its details | `--address --transHash` | ```node transactionList.js --address --transHash```|
| fetchMyOTA.js ** | fetch account OTA | `--address --password` | ```$ node fetchMyOTA.js --address --password```|
| refundOTAs.js | refund OTA | `--address  --OTAaddress --FeeSel  --gasLimit --gasPrice --submit --password` | ```node refundOTAs.js --address  --OTAaddress --FeeSel  --gasLimit --gasPrice --submit --password```|
| ordinaryBalance.js | fetch ordinaray balance info | `--address` | ```node ordinaryBalance.js --address```|
| watchToken.js | fetch watch Token balance info | `--address --tokenAddress` | ```node watchToken.js --address --tokenAddress```|
| tokensend.js | send a token transaction | `--address  --tokenAddress --toaddress --amount --FeeSel  --gasLimit --gasPrice --submit --password` | ```node tokensend.js --address  --tokenAddress --toaddress --amount --FeeSel  --gasLimit --gasPrice --submit --password```|
| version.js | print Wanchain_Command_Line_Wallet version |  | ```node version.js```|
| keystorePath.js | print Wanchain keystore path |  | ```node keystorePath.js```|
| tokenBuyStamp.js | buy Stamp used in token privacy transaction| `--address  --stampBalance --FeeSel  --gasLimit --gasPrice --submit --password` | ```node tokenBuyStamp.js --address  --stampBalance --FeeSel  --gasLimit --gasPrice --submit --password```|
| tokenSendPrivacy.js | send a token privacy transaction| `--address  --contractBalance --waddress  --amount --stampOTA --submit --password` | ```node tokenSendPrivacy.js --address  --contractBalance --waddress  --amount --stampOTA --submit --password```|
| fetchTokenOTA.js | fetch token privacy OTAs| `--address  --password` | ```node fetchTokenOTA.js --address  --password```|
| TokenTransactionList.js | list Token privacy Transactions send from me| `--address` | ```node TokenTransactionList.js --address```|
| watchTokenOTA.js | fetch My OTA Balance from Token address and OTA address| `--address  --tokenAddress --OTAAddress` | ```node watchTokenOTA.js --address  --tokenAddress --OTAAddress```|





new Scan Block Command is backend/wanChainBlockScan.js

** run `cd backend && node wanChainBlockScan.js` in new terminal first


some test Command in test directory is helpful to test:
initPrivacyAsset.js        give you a OTA Balance with 5000 wan
deployContract.js          deploy a new contract