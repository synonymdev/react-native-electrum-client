const assert = require("assert");
const { describe, it } = require("mocha");
const helpers = require("../helpers");
const clients = require("../helpers/clients");
const network = "bitcoinTestnet";
const peer = { host: "tn.not.fyi", port: "55002", protocol: "ssl" };
const customPeers = [peer];

const testPhrase = "know suspect impose snake ice sea usual pony leisure rally style hello limit orphan arrow clinic sustain hurry young immune gather always dash portion";
const addresses = {
	"bitcoin": [],
	"bitcoinTestnet": [
		{address: "tb1qnv5luf8mav8263sxfa4fdr3m6kws74n0yfzzrx", path: "m/84'/1'/0'/0/0", scriptHash: "77ca78f9a84b48041ad71f7cc6ff6c33460c25f0cb99f558f9813ed9e63727dd"},
		{address: "tb1qsmkaeekrq204w8jvty2dtpuksnlu8ct0w4pwst", path: "m/84'/1'/0'/0/1", scriptHash: "743514a90b216fe3b28466353b1304c90010c54a146367a1f0c9ea53511d0409"},
		{address: "tb1qldarhwj08sswsmxeq4rzvqlfl2dax0quy5q7le", path: "m/84'/1'/0'/0/2", scriptHash: "155fd36e4a57ff949e439e695c466a82f17df3ceb90d57686a9ec79ef8edaaa4"},
		{address: "tb1qjlp5zp64v2tq8mm2j05u7psxv6gnkdzzc67pep", path: "m/84'/1'/0'/0/3", scriptHash: "8b47b2f4de51db4c5c5617e448b1f1c48e44963031ece669840e0dc13117af20"},
		{address: "tb1qtnqwzlxrltd4agh7vq7fjjh33kta0f99au5qa8", path: "m/84'/1'/0'/0/4", scriptHash: "eca23eedc40d970b3083521950c2d11368204e80f04e71a0d9e26e8d2fe1c0c6"}
	]
}
const changeAddresses = {
	"bitcoin": [],
	"bitcoinTestnet": [
		{address: "tb1qjn3plhv7nvuerwjzdkcavjyv6a8yt3n3neru9w", path: "m/84'/1'/0'/1/0", scriptHash: "330c608e84fdb8abea609fe5cb63ec51b844aa1bfd2fa43329e503e2a61a21c4"},
		{address: "tb1qazer8866tw7kkevl7xkwz7a9vrpsssppg75fz3", path: "m/84'/1'/0'/1/1", scriptHash: "aa48a8f02d20bf78a46fe6500159dd2528aa6d9edd4c6190a5a5504256428ede"},
		{address: "tb1qe3d76zp4u546vdshpc04a3apsc2yzxq74y50xr", path: "m/84'/1'/0'/1/2", scriptHash: "5a3cbc639145964bda8ac77932faf27662cc3b3cac8a543f084ff31dfa2f5ecb"},
		{address: "tb1qeu3jy528cce03rzkdxp8rphyasc0eq2g5gn7re", path: "m/84'/1'/0'/1/3", scriptHash: "0cf425d51792989639f540f10c90f6a89e67e1443fd76172153d16691c170132"},
		{address: "tb1qmmvcxyx3myjr7kd5k4ghk732jyywl0puyrwhq0", path: "m/84'/1'/0'/1/4", scriptHash: "d605aae846e49cbb9f1b1b8850520aa9c4c42b640ebc4184aaa88ff6bced284a"}
	]
}
const address = addresses["bitcoinTestnet"][0];

/*
  This ensures the response object resembles the following:
  { error: false, data: {} | "" }
 */
const isResponseObject = (response = {}) => {
	assert.strictEqual(typeof response, "object");
	assert("data" in response);
	assert("error" in response);
	assert(typeof response.data === "string" || typeof response.data === "object" || typeof response.data === "number")
	assert.strictEqual(typeof response.error, "boolean");
	assert.strictEqual(response.error, false);
}

/*
  This test should successfully ping the currently connected electrum server.
 */
const pingTest = ({ network = "bitcoinTestnet" } = {}) => {
	it("Should successfully ping server.", async () => {
		const expectedResponse = {
			//id: 0.9297508168964492,
			error: false,
			method: 'pingServer',
			data: { jsonrpc: '2.0', result: null, id: 1 },
			network
		};
		const pingResponse = await helpers.pingServer();
		if (!("error" in pingResponse) || pingResponse.error) console.log("Ping Response:", pingResponse);
		assert("id" in pingResponse);
		delete pingResponse.id;
		assert.deepStrictEqual(pingResponse, expectedResponse);
	});
};

/*
 This test should successfully connect to a random electrum server.
 */
const startRandomPeerTest = () => {
	describe("helpers.start: Connect to random peer.", () => {
		let response = { error: true, data: "" };
		it("Should return a connect response object.", async () => {
			response = await helpers.start({ network });
			//console.log("Random Peer Start Response:", response);
			isResponseObject(response);
		});
		it("Should return connected peer info.", () => {
			assert(Number(response.data.port) > 0);
			assert.strictEqual(typeof response.data.host, "string");
			assert.deepStrictEqual(response.data, { port: clients.peer[network].port, host: clients.peer[network].host } )
		});
		it("Peer info should match.", () => {
			assert.deepStrictEqual(response.data, { port: clients.peer[network].port, host: clients.peer[network].host } )
		});
		pingTest({ network });
	});
};

/*
  This test should successfully disconnect from the current electrum server.
 */
const disconnectTest = () => {
	describe("helpers.stop: Disconnect from peer.", () => {
		let response = { error: true, data: "" };
		it("Should disconnect from specified network peer.", async () => {
			response = await helpers.stop({ network });
			//console.log("Disconnect Response:", disconnectResponse);
			isResponseObject(response);
		});
	});
}

/*
  This test expects to successfully connect to a custom/pre-specified peer.
 */
const startCustomPeerTest = () => {
	describe("helpers.start: Connect to custom/pre-defined peer", () => {
		let response = { error: true, data: "" };
		it("Return a connect response object.", async () => {
			response = await helpers.start({ network, customPeers });
			//console.log("Custom Peer Start Response:", connectResponse);
			isResponseObject(response);
		});
		it("Should return connected peer info.", () => {
			const expectedResponse = {
				error: false,
				data: { port: peer.port, host: peer.host },
				//id: 0.29098913884072286,
				method: 'connectToPeer',
				customPeers: [peer],
				network
			}
			assert("id" in response);
			delete response.id;
			assert.deepStrictEqual(response, expectedResponse);
		});
		it("Peer info should match.", () => {
			assert.deepStrictEqual(peer, clients.peer[network]);
		});
		pingTest({ network });
	});
}

/*
  This test ensures that getAddressScriptHashBalance returns the balance of a specified address scriptHash.
 */
const getAddressScriptHashBalanceTest = ({ network = "bitcoinTestnet", scriptHash = "", description = "", expectedResponse = {} } = {}) => {
	describe(`helpers.getAddressScriptHashBalance: ${description}`, () => {
		let response = { error: true, data: "" };
		it("Should receive response.", async () => {
			response = await helpers.getAddressScriptHashBalance({ network, scriptHash });
			if (!("error" in response) || response.error)  console.log("getAddressBalance Response:", response);
			isResponseObject(response);
		});
		it("Response should match.", async () => {
			assert("id" in response);
			delete response.id;
			assert.deepStrictEqual(response, expectedResponse);
		});
	});
}

/*
  This test should return an array of peer from the currently connect electrum server.
 */
const getPeersTest = () => {
	describe(`helpers.getPeers: Get peers from connected client.`, () => {
		let response = { error: true, data: "" };
		it("Should receive response.", async () => {
			response = await helpers.getPeers({ network });
			if (!("error" in response) || response.error)  console.log("getPeers Response:", response);
			isResponseObject(response);
		});
		it("Response should successfully return an array of peers.", async () => {
			assert.strictEqual(response.error, false);
			assert(Array.isArray(response.data));
		});
	});
}

/*
  This test only ensures that subscribeHeader doesn't fail.
  It can't determine if onReceive is successfully fired when a new block is found.
*/
const subscribeHeaderTest = () => {
	describe(`helpers.subscribeHeader: Subscribe to new blocks.`, () => {
		let response = { error: true, data: "" };
		it("Should successfully subscribe to headers.", async () => {
			response = await helpers.subscribeHeader({
				network,
				onReceive: (data) => {
					console.log("Received a new block!");
					console.log(data);
				}
			});
			if (!("error" in response) || response.error)  console.log("subscribeHeader Response:", response);
			isResponseObject(response)
		});
	});
}

/*
 This test only ensures that subscribeAddress doesn't fail.
 It can't determine if onReceive is successfully fired when the specified address receives funds.
 */
const subscribeAddressTest = () => {
	describe(`helpers.subscribeAddress: Subscribe to address.`, () => {
		let response = { error: true, data: "" };
		it("Should successfully subscribe to address.", async () => {
			response = await helpers.subscribeAddress({
				scriptHash: address.scriptHash,
				network,
				onReceive: (data) => {
					console.log("Received BTC.");
					console.log(data);
				}
			});
			if (!("error" in response) || response.error)  console.log("subscribeAddress Response:", response);
			isResponseObject(response)
		});
	});
}

/*
 This test should return a fee estimate based on blocks willing to wait.
 */
const getFeeEstimateTest = () => {
	describe(`helpers.getFeeEstimate: Get fee estimate base on blocks willing to wait.`, () => {
		let response = { error: true, data: "" };
		it("Should return a success response.", async () => {
			response = await helpers.getFeeEstimate({
				blocksWillingToWait: 30,
				network
			});
			if (!("error" in response) || response.error)  console.log("getFeeEstimate Response:", response);
			isResponseObject(response);
		});
		it("Response should return a number.", () => {
			assert.strictEqual(typeof response.data, "number")
		});
	});
}

describe("electrum-client-helpers", () => {

	startRandomPeerTest();
	
	disconnectTest();
	
	startCustomPeerTest();
	
	getAddressScriptHashBalanceTest({
		network,
		scriptHash: addresses[network][0].scriptHash,
		description: "Attempt to get address scripthash balance.",
		expectedResponse: {
			//id: 0.17807014111851083,
			error: false,
			method: 'getAddressScriptHashBalance',
			data: { confirmed: 27000, unconfirmed: 0 },
			scriptHash: addresses[network][0].scriptHash,
			network
		}
	});
	
	getPeersTest();
	
	subscribeHeaderTest();
	
	subscribeAddressTest();
	
	getFeeEstimateTest();
	
});
