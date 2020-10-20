const assert = require("assert");
const { describe, it } = require("mocha");
const helpers = require("../helpers");

const network = "bitcoinTestnet";
const peer = { host: "bitcoin.lukechilds.co", port: "50002", protocol: "ssl" };
const customPeers = [peer];

describe("electrum-client-helpers", () => {
	
	describe("helpers.start: Connect to random peer.", () => {
		let connectResponse = { error: true, data: "" };
		it("Should return a connect response object.", async () => {
			connectResponse = await helpers.start({ network });
			//console.log("Random Peer Start Response:", connectResponse);
			assert.strictEqual(typeof connectResponse, "object");
			assert.strictEqual(typeof connectResponse.data, "object");
			assert.strictEqual(typeof connectResponse.error, "boolean");
		});
		it("Should return connected peer info.", () => {
			assert(Number(connectResponse.data.port) > 0);
			assert.strictEqual(typeof connectResponse.data.host, "string");
		});
	});
	
	describe("helpers.stop: Disconnect from peer.", () => {
		let disconnectResponse = { error: true, data: "" };
		it("Should disconnect from specified network peer.", async () => {
			disconnectResponse = await helpers.stop({ network });
			//console.log("Disconnect Response:", disconnectResponse);
			assert.strictEqual(typeof disconnectResponse, "object");
			assert.strictEqual(typeof disconnectResponse.error, "boolean");
			assert.strictEqual(disconnectResponse.error, false);
		});
	});
	
	describe("helpers.start: Connect to custom/pre-defined peer", () => {
		const expectedResponse = {
			error: false,
			data: { port: peer.port, host: peer.host },
			//id: 0.29098913884072286,
			method: 'connectToPeer',
			customPeers: [peer],
			network
		}
		
		let connectResponse = { error: true, data: "" };
		it("Return a connect response object.", async () => {
			connectResponse = await helpers.start({ network, customPeers });
			//console.log("Custom Peer Start Response:", connectResponse);
			assert.strictEqual(typeof connectResponse, "object");
			assert.strictEqual(typeof connectResponse.data, "object");
			assert.strictEqual(typeof connectResponse.error, "boolean");
		});
		it("Should return connected peer info.", () => {
			assert("id" in connectResponse);
			delete connectResponse.id;
			assert.deepStrictEqual(connectResponse, expectedResponse);
		});
	});
	
});
