## Install
 - `yarn add rn-electrum-client`

## Usage & Examples
```js
import {
    start,
    getPeers,
    getAddressScriptHashBalance,
    getAddressScriptHashBalances,
    subscribeHeader,
    subscribeAddress
} from "rn-electrum-client/helpers";

//Connect To A Random Electrum Server
const startResponse = await start({ network: "bitcoinTestnet" });
console.log(startResponse);
if (startResponse.error) return;

//Get Server Peers
const getPeersResponse = await getPeers({ network: "bitcoinTestnet" });
console.log(getPeersResponse);

//Get Address Balance
const getAddressScriptHashBalanceResponse = await getAddressScriptHashBalance({
    network: "bitcoinTestnet",
    scriptHash: "77ca78f9a84b48041ad71f7cc6ff6c33460c25f0cb99f558f9813ed9e63727dd"
});
console.log(getAddressScriptHashBalanceResponse);

//Subscribe To Headers
const subscribeHeaderResponse = await subscribeHeader({
    network: "bitcoinTestnet",
    onReceive: (data) => { console.log("New block!", data); } 
});
console.log(subscribeHeaderResponse);

//Subscribe To An Address
const subscribeAddressResponse = await subscribeAddress({
  network: "bitcoinTestnet",
  scriptHash: "77ca78f9a84b48041ad71f7cc6ff6c33460c25f0cb99f558f9813ed9e63727dd", //tb1qnv5luf8mav8263sxfa4fdr3m6kws74n0yfzzrx
  onReceive: (data) => { console.log("Received some Testnet BTC!", data); }
});
console.log(subscribeAddressResponse);

//Get Address Balances (Batch Method)
const getAddressScriptHashes = [
	"21031994b184684de964e930e9937b1b6d75c9af12bb99ae6ee266a724e12632",
	"9ff2d1500272589aff699e1582dbc2f47a7bbe19f7d3a4d77e1c9e54735d4fc4",
	"bfb2a1c0a45421f908e0b3f63cee65a2dee33ae276bdb82c6f53f6ec1d53093b",
	"ce2b6d0b4ed19ff9b264d1d218220cae85388b6d53a539bd0852404b65d74b1b",
	"4470798cb53a34f8adf763248c90b7b09e6375043a74346d5ad9a1b6c6cc1130"
];
const getAddressScriptHashBalancesResponse = await getAddressScriptHashBalances({
    scriptHashes: getAddressScriptHashes,
  	network: "bitcoinTestnet"
});
console.log(getAddressScriptHashBalancesResponse);

/*
We are also able to get out what we put in using the following patterns.
This works with any batch method.
*/
const getAddressScriptHashes2 = {
    key: "scriptHash",
    data: [
        {
            address: "tb1qnv5luf8mav8263sxfa4fdr3m6kws74n0yfzzrx",
            path: "m/84'/1'/0'/0/0",
            scriptHash: "77ca78f9a84b48041ad71f7cc6ff6c33460c25f0cb99f558f9813ed9e63727dd"
        },
    ]
};
const getAddressScriptHashBalancesResponse2 = await getAddressScriptHashBalances({
    scriptHashes: getAddressScriptHashes2,
  	network: "bitcoinTestnet"
});
console.log(getAddressScriptHashBalancesResponse2);

const getAddressScriptHashes3 = {
    key: "scriptHash",
    data: {
        77ca78f9a84b48041ad71f7cc6ff6c33460c25f0cb99f558f9813ed9e63727dd: {
            address: "tb1qnv5luf8mav8263sxfa4fdr3m6kws74n0yfzzrx",
            path: "m/84'/1'/0'/0/0",
            scriptHash: "77ca78f9a84b48041ad71f7cc6ff6c33460c25f0cb99f558f9813ed9e63727dd"
        },
    }
};
const getAddressScriptHashBalancesResponse3 = await getAddressScriptHashBalances({
    scriptHashes: getAddressScriptHashes3,
  	network: "bitcoinTestnet"
});
console.log(getAddressScriptHashBalancesResponse3);
```
