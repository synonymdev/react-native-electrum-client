class Clients {
	constructor() {
		this.network = "bitcoin";
		this.mainClient = {
			bitcoin: false,
			bitcoinTestnet: false
		};
		this.peer = {
			bitcoin: { port: 0, host: "", protocol: "" },
			bitcoinTestnet: { port: 0, host: "", protocol: "" }
		};
		this.peers = {
			bitcoin: [],
			bitcoinTestnet: []
		};
		this.subscribedAddresses = {
			bitcoin: [],
			bitcoinTestnet: []
		};
	}
	
	updateNetwork(network) {
		this.network = network;
	}
	
	updateMainClient(mainClient) {
		this.mainClient = mainClient;
	}
	
	updatePeer(peer) {
		this.peer = peer;
	}
	
}

module.exports = new Clients();
