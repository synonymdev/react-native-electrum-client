import { ENetwork } from '../lib/types';

const network = ENetwork.bitcoinTestnet;

const peer = {
  host: 'testnet.aranguren.org',
  tcp: 51001,
  ssl: 51002,
  protocol: "ssl",
};

const testPhrase =
  'know suspect impose snake ice sea usual pony leisure rally style hello limit orphan arrow clinic sustain hurry young immune gather always dash portion';

const addresses = {
  bitcoin: [],
  bitcoinTestnet: [
    {
      address: 'tb1qnv5luf8mav8263sxfa4fdr3m6kws74n0yfzzrx',
      path: "m/84'/1'/0'/0/0",
      scriptHash:
        '77ca78f9a84b48041ad71f7cc6ff6c33460c25f0cb99f558f9813ed9e63727dd',
    },
    {
      address: 'tb1qsmkaeekrq204w8jvty2dtpuksnlu8ct0w4pwst',
      path: "m/84'/1'/0'/0/1",
      scriptHash:
        '743514a90b216fe3b28466353b1304c90010c54a146367a1f0c9ea53511d0409',
    },
    {
      address: 'tb1qldarhwj08sswsmxeq4rzvqlfl2dax0quy5q7le',
      path: "m/84'/1'/0'/0/2",
      scriptHash:
        '155fd36e4a57ff949e439e695c466a82f17df3ceb90d57686a9ec79ef8edaaa4',
    },
    {
      address: 'tb1qjlp5zp64v2tq8mm2j05u7psxv6gnkdzzc67pep',
      path: "m/84'/1'/0'/0/3",
      scriptHash:
        '8b47b2f4de51db4c5c5617e448b1f1c48e44963031ece669840e0dc13117af20',
    },
    {
      address: 'tb1qtnqwzlxrltd4agh7vq7fjjh33kta0f99au5qa8',
      path: "m/84'/1'/0'/0/4",
      scriptHash:
        'eca23eedc40d970b3083521950c2d11368204e80f04e71a0d9e26e8d2fe1c0c6',
    },
  ],
};

const changeAddresses = {
  bitcoin: [],
  bitcoinTestnet: [
    {
      address: 'tb1qjn3plhv7nvuerwjzdkcavjyv6a8yt3n3neru9w',
      path: "m/84'/1'/0'/1/0",
      scriptHash:
        '330c608e84fdb8abea609fe5cb63ec51b844aa1bfd2fa43329e503e2a61a21c4',
    },
    {
      address: 'tb1qazer8866tw7kkevl7xkwz7a9vrpsssppg75fz3',
      path: "m/84'/1'/0'/1/1",
      scriptHash:
        'aa48a8f02d20bf78a46fe6500159dd2528aa6d9edd4c6190a5a5504256428ede',
    },
    {
      address: 'tb1qe3d76zp4u546vdshpc04a3apsc2yzxq74y50xr',
      path: "m/84'/1'/0'/1/2",
      scriptHash:
        '5a3cbc639145964bda8ac77932faf27662cc3b3cac8a543f084ff31dfa2f5ecb',
    },
    {
      address: 'tb1qeu3jy528cce03rzkdxp8rphyasc0eq2g5gn7re',
      path: "m/84'/1'/0'/1/3",
      scriptHash:
        '0cf425d51792989639f540f10c90f6a89e67e1443fd76172153d16691c170132',
    },
    {
      address: 'tb1qmmvcxyx3myjr7kd5k4ghk732jyywl0puyrwhq0',
      path: "m/84'/1'/0'/1/4",
      scriptHash:
        'd605aae846e49cbb9f1b1b8850520aa9c4c42b640ebc4184aaa88ff6bced284a',
    },
  ],
};

const address = addresses['bitcoinTestnet'][0];

const scriptHashes = [
  '77ca78f9a84b48041ad71f7cc6ff6c33460c25f0cb99f558f9813ed9e63727dd',
  '743514a90b216fe3b28466353b1304c90010c54a146367a1f0c9ea53511d0409',
  '155fd36e4a57ff949e439e695c466a82f17df3ceb90d57686a9ec79ef8edaaa4',
  '8b47b2f4de51db4c5c5617e448b1f1c48e44963031ece669840e0dc13117af20',
  'eca23eedc40d970b3083521950c2d11368204e80f04e71a0d9e26e8d2fe1c0c6',
];

const scriptHashData = {
  key: 'scriptHash',
  data: [
    {
      address: 'tb1qnv5luf8mav8263sxfa4fdr3m6kws74n0yfzzrx',
      path: "m/84'/1'/0'/0/0",
      scriptHash:
        '77ca78f9a84b48041ad71f7cc6ff6c33460c25f0cb99f558f9813ed9e63727dd',
    },
    {
      address: 'tb1qsmkaeekrq204w8jvty2dtpuksnlu8ct0w4pwst',
      path: "m/84'/1'/0'/0/1",
      scriptHash:
        '743514a90b216fe3b28466353b1304c90010c54a146367a1f0c9ea53511d0409',
    },
  ],
};

const addressScriptHashBalance = {
  // id: 0.17807014111851083,
  error: false,
  method: 'getAddressScriptHashBalance',
  data: { confirmed: 27000, unconfirmed: 0 },
  scriptHash: addresses[network][0].scriptHash,
  network,
};

const addressScriptHashBalances = {
  error: false,
  // id: 0.4953846351782525,
  method: 'getAddressScriptHashBalances',
  network: 'bitcoinTestnet',

  data: [
    {
      id: 5,
      jsonrpc: '2.0',
      result: {
        confirmed: 27000,
        unconfirmed: 0,
      },
      param: '77ca78f9a84b48041ad71f7cc6ff6c33460c25f0cb99f558f9813ed9e63727dd',
      data: {},
    },
    {
      id: 9,
      jsonrpc: '2.0',
      result: {
        confirmed: 2000,
        unconfirmed: 0,
      },
      param: 'eca23eedc40d970b3083521950c2d11368204e80f04e71a0d9e26e8d2fe1c0c6',
      data: {},
    },
    {
      id: 6,
      jsonrpc: '2.0',
      result: {
        confirmed: 0,
        unconfirmed: 0,
      },
      param: '743514a90b216fe3b28466353b1304c90010c54a146367a1f0c9ea53511d0409',
      data: {},
    },
    {
      id: 7,
      jsonrpc: '2.0',
      result: {
        confirmed: 8000,
        unconfirmed: 0,
      },
      param: '155fd36e4a57ff949e439e695c466a82f17df3ceb90d57686a9ec79ef8edaaa4',
      data: {},
    },
    {
      id: 8,
      jsonrpc: '2.0',
      result: {
        confirmed: 4000,
        unconfirmed: 0,
      },
      param: '8b47b2f4de51db4c5c5617e448b1f1c48e44963031ece669840e0dc13117af20',
      data: {},
    },
  ],
};

export default {
  network,
  peer,
  testPhrase,
  address,
  addresses,
  changeAddresses,
  scriptHashes,
  scriptHashData,
  expected: {
    addressScriptHashBalance,
    addressScriptHashBalances,
  },
};
