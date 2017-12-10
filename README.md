# Wanchain_Command_Line_Wallet
Wanchain Command Line Wallet

## How to use Wanchain Command Line Wallet

download geth from web
run geth

## run in windows x64
download wanChainClient_win64.zip
run wanchain_client.cmd

## run in linux and mac

dowload Wanchain_Command_Line_Wallet from https://github.com/wanchain/Wanchain_Command_Line_Wallet
run npm install first

## run  Wanchain Command Line Wallet

run node ..\backend\syncOta.js to Scan OTAs

run *.js file as node *.js in command line
you can input command parameters as default parameters
input a parameter value 'Q' or 'q' to exit;

## command details
- createKeystore.js: create new account

    command parameters: --password  --repeatPass

- send.js: send a transaction

    command parameters: --AccountNo  --toAddress --amount --FeeSel  --gasLimit --gasPrice --submit --password

- sendPrivacy.js: send with privacy

    command parameters: --AccountNo  --waddress --amount --FeeSel  --gasLimit --gasPrice --submit --password

- transactionList.js: Print transaction list and transaction details

    command parameters: --AccountNo --TransNo

- fetchMyOTA.js: fetch account OTA.

    command parameters: --AccountNo --password

    please run node ..\backend\syncOta.js in new terminal first.

- refundOTAs.js: refund OTA

    command parameters: --AccountNo  --OTAsNo --FeeSel  --gasLimit --gasPrice --submit --password

- version.js: print Wanchain_Command_Line_Wallet version
- keystorePath.js: print Wanchain keystore path
