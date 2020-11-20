## Install
 - `yarn add https://github.com/synonymdev/rn-electrum-client`

## Usage & Examples
```
import {
    start,
    getPeers,
    getAddressScriptHashBalance,
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
```
