const constants = require("./constants");

const assert = require("assert");
const { describe, it } = require("mocha");
const helpers = require("../helpers");
const clients = require("../helpers/clients");
const {
	network,
	peer,
	customPeers,
	testPhrase,
	address,
	addresses,
	changeAddresses,
	scriptHashes,
	scriptHashData,
	expectedResponses
} = constants;

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
			if (!("error" in response) || response.error)  console.log("getAddressScriptHashBalance Response:", response);
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
  This test ensures that getAddressScriptHashBalances returns the balance of specified address scriptHashes.
 */
const getAddressScriptHashBalancesTest = ({ network = "bitcoinTestnet", scriptHashes = [], description = "", expectedResponse = {} } = {}) => {
	describe(`helpers.getAddressScriptHashBalances: ${description}`, () => {
		let response = { error: true, data: "" };
		it("Should receive response.", async () => {
			response = await helpers.getAddressScriptHashBalances({ network, scriptHashes: scriptHashData });
			if (!("error" in response) || response.error)  console.log("getAddressScriptHashBalances Response:", response);
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
		expectedResponse: expectedResponses.getAddressScriptHashBalanceTest
	});

	getAddressScriptHashBalancesTest({
		network,
		scriptHash: scriptHashes,
		description: "Attempt to get address scripthash balance.",
		expectedResponse: expectedResponses.getAddressScriptHashBalancesTest
	});

	getPeersTest();

	subscribeHeaderTest();

	subscribeAddressTest();

	getFeeEstimateTest();

});
