#!/bin/sh
cd src
node createKeystore.js --password 111111111  --repeatPass 111111111
node send.js --AccountNo 3   --toaddress 0x896f4ea0dde222bd55464d464898456859046ef4 --amount 1 --FeeSel 1  --password wanglu --submit Y
node sendPrivacy.js  --AccountNo 3   --waddress 02313cc452687f27b4a916fb5a817c7a4f1b83c9b0f79bd30ddca3e941874b6d7303ed956289212ed11d43063c6455996923d82af42a5b4a0e99413cf87e2229beb9 --PrivacyAmount 6 --FeeSel 1  --password wanglu --submit Y
node transactionList.js --AccountNo 3 --TransNo q
node fetchMyOTA.js --AccountNo 3 --password wanglu
node refundOTAs.js --AccountNo 3  --OTAsNo 1 --FeeSel 1 --submit y --password wanglu

node sendPrivacy.js  --AccountNo 3   --waddress 02313cc452687f27b4a916fb5a817c7a4f1b83c9b0f79bd30ddca3e941874b6d7303ed956289212ed11d43063c6455996923d82af42a5b4a0e99413cf87e2229beb9 --PrivacyAmount 6 --FeeSel 1  --password wanglu --submit Y
