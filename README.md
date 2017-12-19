# Wanchain_Command_Line_Wallet
Wanchain Command Line Wallet

## How to use Wanchain Command Line Wallet

## run in windows x64
- download https://github.com/wanchain/go-wanchain/releases/ for win_geth.zip the lastest version
- unzip and run geth.exe
- download https://github.com/wanchain/go-wanchain/releases/ for wanchainclient_cli_win64.zip the lastest version
- unzip and run wanchain_client.cmd

## run in linux and mac
- Environment nodejs v8+
- download https://github.com/wanchain/go-wanchain/releases/ for linux_geth.tar.gz the lastest version
- unzip and run geth.exe

dowload Wanchain_Command_Line_Wallet from https://github.com/wanchain/Wanchain_Command_Line_Wallet

    $ git clone https://github.com/wanchain/Wanchain_Command_Line_Wallet.git
    $ cd Wanchain_Command_Line_Wallet npm install
    
## Select wanchain network

- Running geth.exe with network parameter.
- Modify var wanchainNet in config.js. 

## run  Wanchain Command Line Wallet

    $ cd src

#### If you want fetch OTAs, please run node ..\backend\syncOta.js to Scan OTAs in new terminal first.

    $ node ..\backend\syncOta.js


run *.js file as node *.js in command line. For example

    $ node createKeystore.js

you can input command parameters as default parameters
input a parameter value 'Q' or 'q' to exit;

## command details
- createKeystore.js: create new account

    command parameters: --password  --repeatPass

- send.js: send a transaction

    command parameters: --address  --toaddress --amount --FeeSel  --gasLimit --gasPrice --submit --password

- sendPrivacy.js: send with privacy

    command parameters: --address  --waddress --PrivacyAmount --FeeSel  --gasLimit --gasPrice --submit --password

- transactionList.js: Print transaction list and transaction details

    command parameters: --address --transHash

- fetchMyOTA.js: fetch account OTA.

    command parameters: --address --password

    please run node ..\backend\syncOta.js in new terminal first.

- refundOTAs.js: refund OTA

    command parameters: --address  --OTAaddress --FeeSel  --gasLimit --gasPrice --submit --password

- ordinaryBalance.js: fetch ordinaray balance info.

    command parameters: --address

- watchToken.js: fetch watch Token balance info.

    command parameters: --address --tokenAddress

- tokensend.js: send a token transaction

    command parameters: --address  --tokenAddress --toaddress --amount --FeeSel  --gasLimit --gasPrice --submit --password


- version.js: print Wanchain_Command_Line_Wallet version
- keystorePath.js: print Wanchain keystore path
