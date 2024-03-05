const ElectrumClient = require("../lib/electrum_client");
const clients = require("./clients");

let electrumKeepAlive = () => null;
let electrumKeepAliveInterval = 60000;

const _getTimeout = ({ arr = [], timeout = 2000 } = {}) => {
	try {
		if (!Array.isArray(arr)) arr = _attemptToGetArray(arr);
		if (arr && Array.isArray(arr) && arr.length > 0) return (arr.length * timeout)/2 | timeout;
		return timeout;
	} catch {
		return timeout;
	}
}

const _attemptToGetArray = (item = []) => {
	try {
		if (Array.isArray(item)) return item;
		if ("data" in item) {
			if (Array.isArray(item.data)) return item.data;
			if (typeof item.data === 'object') return Object.values(item.data);
		}
		return [];
	} catch { return []; }
};

const promiseTimeout = (ms, promise) => {
	let id;
	let timeout = new Promise((resolve) => {
		id = setTimeout(() => {
			resolve({ error: true, data: "Timed Out." });
		}, ms);
	});

	return Promise.race([
		promise,
		timeout
	]).then((result) => {
		clearTimeout(id);
		try {if ("error" in result && "data" in result) return result;} catch {}
		return { error: false, data: result };
	});
};

const pauseExecution = (duration = 500) => {
	return new Promise(async (resolve) => {
		try {
			const wait = () => resolve({error: false});
			await setTimeout(wait, duration);
		} catch (e) {
			console.log(e);
			resolve({error: true});
		}
	});
};

const getDefaultPeers = (network, protocol) => {
	return require("./peers.json")[network].map(peer => {
		try {
			return { ...peer, protocol };
		} catch {}
	});
};

const pingServer = ({ id = Math.random() } = {}) => {
	const method = "pingServer";
	return new Promise(async (resolve) => {
		try {
			if (!(clients.mainClient?.[clients.network]
				&& typeof clients.mainClient[clients.network] === 'object'
				&& clients.mainClient[clients.network]?.server_ping)
			){
				const connectRes = await connectToRandomPeer(clients.network, clients.peers[clients.network]);
				if (connectRes.error) return resolve({...connectRes, id, method, network: clients.network});
			}
			const { error, data } = await promiseTimeout(_getTimeout(), clients.mainClient[clients.network].server_ping());
			resolve({ id, error, method, data, network: clients.network });
		} catch (e) {
			resolve({ id, error: true, method, data: e, network: clients.network });
		}
	});
};

//peers = A list of peers acquired from default electrum servers using the getPeers method.
//customPeers = A list of peers added by the user to connect to by default in lieu of the default peer list.
const start = ({ id = Math.random(), network = "", peers = [], customPeers = [], net, tls} = {}) => {
	const method = "connectToPeer";
	return new Promise(async (resolve) => {
		try {
			if (!network) {
				resolve({
					id,
					method: "connectToPeer",
					error: true,
					data: "No network specified",
				});
				return;
			}
			//Clear/Remove any previous keep-alive message.
			try {clearInterval(electrumKeepAlive);} catch {}
			clients.network = network;
			let customPeersLength = 0;
			try {customPeersLength = customPeers.length;} catch {}
			//Attempt to connect to specified peer
			let connectionResponse = { error: true, data: "" };
			if (customPeersLength > 0) {
				const { host = "", protocol = "ssl" } = customPeers[0];
				const port = customPeers[0][protocol];
				connectionResponse = await connectToPeer({ host, port, protocol, network, net, tls });
			} else {
				//Attempt to connect to random peer if none specified
				connectionResponse = await connectToRandomPeer(network, peers, 'ssl', net, tls);
			}
			resolve({
				...connectionResponse,
				id,
				method: "connectToPeer",
				customPeers,
				network
			});
		} catch (e) {
			console.log(e);
			resolve({ error: true, method, data: e });
		}
	});
};

const connectToPeer = ({ port = 50002, host = "", protocol = "ssl", network = "bitcoin", net, tls } = {}) => {
	return new Promise(async (resolve) => {
		try {
			clients.network = network;
			let needToConnect = clients.mainClient[network] === false || clients.peer[network]?.host !== host || clients.peer[network]?.port !== port || clients.peer[network]?.protocol !== protocol;
			let connectionResponse = { error: false, data: clients.peer[network] };
			if (!needToConnect) {
				//Ensure the server is still alive
				const pingResponse = await pingServer();
				if (pingResponse.error) {
					await disconnectFromPeer({ network });
					needToConnect = true;
				}
			}
			if (needToConnect) {
				clients.mainClient[network] = new ElectrumClient(port, host, protocol, net, tls);
				connectionResponse = await promiseTimeout(_getTimeout(), clients.mainClient[network].connect());
				if (connectionResponse.error) {
					return resolve(connectionResponse);
				}
				/*
				 * The scripthash doesn't have to be valid.
				 * We're simply testing if the server will respond to a batch request.
				 */
				const scriptHash = "77ca78f9a84b48041ad71f7cc6ff6c33460c25f0cb99f558f9813ed9e63727dd";
				const testResponses = await Promise.all([
					pingServer(),
					getAddressScriptHashBalances({ network, scriptHashes: [scriptHash] }),
				])
				if (testResponses[0].error || testResponses[1].error) {
					return resolve({ error: true, data: "" });
				}
				try {
					//Clear/Remove Electrum's keep-alive message.
					clearInterval(electrumKeepAlive);
					//Start Electrum's keep-alive function. It’s sent every minute as a keep-alive message.
					electrumKeepAlive = setInterval(async () => {
						try {pingServer({ id: Math.random() });} catch {}
					}, electrumKeepAliveInterval);
				} catch (e) {}
				clients.peer[network] = { port, host, protocol };
			}
			resolve(connectionResponse);
		} catch (e) {resolve({ error: true, data: e });}
	});
};

const connectToRandomPeer = async (network, peers = [], protocol = "ssl", net, tls) => {
	//Peers can be found in peers.json.
	//Additional Peers can be located here in servers.json & servers_testnet.json for reference: https://github.com/spesmilo/electrum/tree/master/electrum
	let hasPeers = false;
	try {
		hasPeers = (Array.isArray(peers) && peers.length) || (Array.isArray(clients.peers[network]) && clients.peers[network].length);
	} catch {}
	if (hasPeers) {
		if (Array.isArray(peers) && peers.length) {
			//Update peer list
			clients.peers[network] = peers;
		} else {
			//Set the saved peer list
			peers = clients.peers[network];
		}
	} else {
		//Use the default peer list for a connection if no other peers were passed down and no saved peer list is present.
		peers = getDefaultPeers(network, protocol);
	}
	const initialPeerLength = peers.length; //Acquire length of our default peers.
	//Attempt to connect to a random default peer. Continue to iterate through default peers at random if unable to connect.
	for (let i = 0; i <= initialPeerLength; i++) {
		try {
			const randomIndex = peers.length * Math.random() | 0;
			const peer = peers[randomIndex];
			let port = "50002";
			let host = "";
			if (hasPeers) {
				port = peer.port;
				host = peer.host;
				protocol = peer.protocol;
			} else {
				port = peer[peer.protocol];
				host = peer.host;
				protocol = peer.protocol;
			}
			const connectionResponse = await connectToPeer({ port, host, protocol, network, net, tls });
			if (connectionResponse.error === false && connectionResponse.data) {
				return {
					error: connectionResponse.error,
					method: "connectToRandomPeer",
					data: connectionResponse.data,
					network
				};
			} else {
				//clients.mainClient[network].close && clients.mainClient[network].close();
				clients.mainClient[network] = false;
				if (peers.length === 1) {
					return {
						error: true,
						method: "connectToRandomPeer",
						data: connectionResponse.data,
						network
					};
				}
				peers.splice(randomIndex, 1);
			}
		} catch (e) {console.log(e);}
	}
	return { error: true, method: "connectToRandomPeer", data: "Unable to connect to any peer." };
};

const stop = async ({ network = "" } = {}) => {
	return new Promise(async (resolve) => {
		try {
			//Clear/Remove Electrum's keep-alive message.
			clearInterval(electrumKeepAlive);
			//Disconnect from peer
			const response = await disconnectFromPeer({ network });
			resolve(response);
		} catch (e) {
			resolve({ error: true, data: e });
		}
	});

};

const disconnectFromPeer = async ({ id = Math.random(), network = "" } = {}) => {
	try {
		if (clients.mainClient[network] === false) {
			//No peer to disconnect from...
			return {
				error: false,
				data: "No peer to disconnect from.",
				id,
				network,
				method: "disconnectFromPeer"
			};
		}
		//Attempt to disconnect from peer...
		clients.mainClient[network].close();
		await pauseExecution();
		//Reset the client.
		clients.mainClient[network] = false;
		clients.peer[network] = { port: 0, host: "", protocol: "" };
		clients.peers[network] = [];
		clients.subscribedAddresses[network] = [];
		clients.subscribedHeaders[network] = false;
		clients.onAddressReceive[network] = undefined;
		clients.network = "";
		return { error: false, id, method: "disconnectFromPeer", network, data: "Disconnected..." };
	} catch (e) {
		return { error: true, id, method: "disconnectFromPeer", data: e };
	}
};

const getAddressScriptHashBalance = ({ scriptHash = "", id = Math.random(), network = "" } = {}) => {
	const method = "getAddressScriptHashBalance";
	return new Promise(async (resolve) => {
		try {
			if (!(clients.mainClient?.[network]
				&& typeof clients.mainClient[network] === 'object'
				&& clients.mainClient[network]?.blockchainScripthash_getBalance)
			){
				const connectRes = await connectToRandomPeer(network, clients.peers[network]);
				if (connectRes.error) return resolve({...connectRes, id, scriptHash, method});
			}
			const { error, data } = await promiseTimeout(_getTimeout(), clients.mainClient[network].blockchainScripthash_getBalance(scriptHash));
			resolve({ id, error, method, data, scriptHash, network });
		} catch (e) {
			console.log(e);
			resolve({ id, error: true, method, data: e, network });
		}
	});
};

const getPeers = ({ id = Math.random(), network = "" } = {}) => {
	const method = "getPeers";
	return new Promise(async (resolve) => {
		try {
			if (!(clients.mainClient?.[network]
				&& typeof clients.mainClient[network] === 'object'
				&& clients.mainClient[network]?.serverPeers_subscribe)
			){
				const connectRes = await connectToRandomPeer(network, clients.peers[network]);
				if (connectRes.error) return resolve({...connectRes, id, method});
			}
			const data = await clients.mainClient[network].serverPeers_subscribe();
			resolve({ id, error: false, method, data, network });
		} catch (e) {
			console.log(e);
			resolve({ id, error: true, method, data: null, network });
		}
	});
};

const getConnectedPeer = (network = 'bitcoin') => {
	try {
		return clients?.peer[network] ?? '';
	} catch {
		return '';
	}
};

const subscribeHeader = async ({ id = "subscribeHeader", network = "", onReceive = () => null } = {}) => {
	const method = "subscribeHeader";
	try {
		if (!(clients.mainClient?.[network]
			&& typeof clients.mainClient[network] === 'object'
			&& clients.mainClient[network]?.subscribe)
		){
			const connectRes = await connectToRandomPeer(network, clients.peers[network]);
			if (connectRes.error) return({...connectRes, id, method, network});
		}
		if (clients.subscribedHeaders[network] === true) return { id, error: false, method, data: 'Already Subscribed.', network };
		const res = await promiseTimeout(10000,  clients.mainClient[network].subscribe.on('blockchain.headers.subscribe', (onReceive)));
		if (res.error) return { ...res, id, method };
		const response = await promiseTimeout(10000, clients.mainClient[network].blockchainHeaders_subscribe());
		if (!response.error) clients.subscribedHeaders[network] = true;
		return { ...response, id, method };
	} catch (e) {
		return { id, error: true, method, data: e, network };
	}
};

const subscribeAddress = async ({ id = Math.random(), scriptHash = "", network = "bitcoin", onReceive = undefined } = {}) => {
	const method = "subscribeAddress";
	try {
		if (!(clients.mainClient?.[network]
			&& typeof clients.mainClient[network] === 'object'
			&& clients.mainClient[network]?.subscribe)
		){
			const connectRes = await connectToRandomPeer(network, clients.peers[network]);
			if (connectRes.error) return({...connectRes, id, method});
		}

		// Set onAddressReceive if wasn't previously.
		if (onReceive && !clients.onAddressReceive[network]) {
			clients.onAddressReceive[network] = onReceive;
			const res = await promiseTimeout(10000,  clients.mainClient[network].subscribe.on('blockchain.scripthash.subscribe', clients.onAddressReceive[network]));
			if (res.error) {
				return { ...res, id, method };
			}
		}

		//Ensure this address is not already subscribed
		if (clients.subscribedAddresses[network].includes(scriptHash)) return { id, error: false, method, data: "Already Subscribed." };
		const response = await promiseTimeout(10000, clients.mainClient[network].blockchainScripthash_subscribe(scriptHash));
		if (!response.error) clients.subscribedAddresses[network].push(scriptHash);
		return { ...response, id, method };
	} catch (e) {
		return { id, error: true, method, data: e };
	}
};

const getFeeEstimate = ({ blocksWillingToWait = 8, id = Math.random(), network = "" } = {}) => {
	const method = "getFeeEstimate";
	return new Promise(async (resolve) => {
		try {
			if (!(clients.mainClient?.[network]
				&& typeof clients.mainClient[network] === 'object'
				&& clients.mainClient[network]?.blockchainEstimatefee)
			) {
				const connectRes = await connectToRandomPeer(network, clients.peers[network]);
				if (connectRes.error) return resolve({...connectRes, id, method, network});
			}
			const response = await promiseTimeout(_getTimeout(), clients.mainClient[network].blockchainEstimatefee(blocksWillingToWait));
			resolve({ ...response, id, method, network });
		} catch (e) {
			console.log(e);
			resolve({ id, error: true, method, data: e, network });
		}
	});
};

const getAddressScriptHashBalances = ({ scriptHashes = [], id = Math.random(), network = "" } = {}) => {
	const method = "getAddressScriptHashBalances";
	return new Promise(async (resolve) => {
		try {
			if (!(clients.mainClient?.[network]
				&& typeof clients.mainClient[network] === 'object'
				&& clients.mainClient[network]?.blockchainScripthash_getBalanceBatch)
			){
				const connectRes = await connectToRandomPeer(network, clients.peers[network]);
				if (connectRes.error) return resolve({...connectRes, id, method, network});
			}
			const timeout = _getTimeout({ arr: scriptHashes });
			const response = await promiseTimeout(timeout, clients.mainClient[network].blockchainScripthash_getBalanceBatch(scriptHashes));
			resolve({ ...response, id, method, network });
		} catch (e) {
			console.log(e);
			resolve({ id, error: true, method, data: e, network });
		}
	});
};

const listUnspentAddressScriptHashes = ({ scriptHashes = [], id = Math.random(), network = "", timeout = undefined } = {}) => {
	const method = "listUnspentAddressScriptHashes";
	return new Promise(async (resolve) => {
		try {
			if (!(clients.mainClient?.[network]
				&& typeof clients.mainClient[network] === 'object'
				&& clients.mainClient[network]?.blockchainScripthash_listunspentBatch)
			){
				const connectRes = await connectToRandomPeer(network, clients.peers[network]);
				if (connectRes.error) return resolve({...connectRes, id, method, network});
			}
			if (!timeout) timeout = _getTimeout({ arr: scriptHashes });
			const { error, data } = await promiseTimeout(timeout, clients.mainClient[network].blockchainScripthash_listunspentBatch(scriptHashes));
			resolve({ id, error, method, data, network });
		} catch (e) {
			console.log(e);
			resolve({ id, error: true, method, data: e, network });
		}
	});
};

const getAddressScriptHashesHistory = ({ scriptHashes = [], id = Math.random(), network = "", timeout = undefined } = {}) => {
	const method = "getScriptHashesHistory";
	return new Promise(async (resolve) => {
		try {
			if (!(clients.mainClient?.[network]
				&& typeof clients.mainClient[network] === 'object'
				&& clients.mainClient[network]?.blockchainScripthash_getHistoryBatch)
			){
				const connectRes = await connectToRandomPeer(network, clients.peers[network]);
				if (connectRes.error) return resolve({...connectRes, id, method, network});
			}
			if (!timeout) timeout = _getTimeout({ arr: scriptHashes });
			const { error, data } = await promiseTimeout(timeout, clients.mainClient[network].blockchainScripthash_getHistoryBatch(scriptHashes));
			resolve({ id, error, method, data, network });
		} catch (e) {
			console.log(e);
			resolve({ id, error: true, method, data: e, network });
		}
	});
};

const getAddressScriptHashesMempool = ({ scriptHashes = [], id = Math.random(), network = "", timeout = undefined } = {}) => {
	const method = "getAddressScriptHashesMempool";
	return new Promise(async (resolve) => {
		try {
			if (!(clients.mainClient?.[network]
				&& typeof clients.mainClient[network] === 'object'
				&& clients.mainClient[network]?.blockchainScripthash_getMempoolBatch)
			){
				const connectRes = await connectToRandomPeer(network, clients.peers[network]);
				if (connectRes.error) return resolve({...connectRes, id, method, network});
			}
			if (!timeout) timeout = _getTimeout({ arr: scriptHashes });
			const { error, data } = await promiseTimeout(timeout, clients.mainClient[network].blockchainScripthash_getMempoolBatch(scriptHashes));
			resolve({ id, error, method, data, network });
		} catch (e) {
			console.log(e);
			resolve({ id, error: true, method, data: e, network });
		}
	});
};

const getTransactions = ({ txHashes = [], id = Math.random(), network = "", timeout = undefined } = {}) => {
	const method = "getTransactions";
	return new Promise(async (resolve) => {
		try {
			if (!(clients.mainClient?.[network]
				&& typeof clients.mainClient[network] === 'object'
				&& clients.mainClient[network]?.blockchainTransaction_getBatch)
			){
				const connectRes = await connectToRandomPeer(network, clients.peers[network]);
				if (connectRes.error) return resolve({...connectRes, id, method, network});
			}
			if (!timeout) timeout = _getTimeout({ arr: txHashes });
			const { error, data } = await promiseTimeout(timeout, clients.mainClient[network].blockchainTransaction_getBatch(txHashes, true));
			resolve({ id, error, method, data, network });
		} catch (e) {
			console.log(e);
			resolve({ id, error: true, method, data: e, network });
		}
	});
};

const broadcastTransaction = ({ rawTx = [], id = Math.random(), network = "", timeout = undefined } = {}) => {
	const method = "broadcastTransaction";
	return new Promise(async (resolve) => {
		try {
			if (!(clients.mainClient?.[network]
				&& typeof clients.mainClient[network] === 'object'
				&& clients.mainClient[network]?.blockchainTransaction_broadcast)
			){
				const connectRes = await connectToRandomPeer(network, clients.peers[network]);
				if (connectRes.error) return resolve({...connectRes, id, method, network});
			}
			if (!timeout) timeout = _getTimeout();
			const { error, data } = await promiseTimeout(timeout, clients.mainClient[network].blockchainTransaction_broadcast(rawTx));
			resolve({ id, error, method, data, network });
		} catch (e) {
			resolve({ id, error: true, method, data: e, network });
		}
	});
};

/**
 * Returns header hex of the provided height and network.
 * @param {Number} [height]
 * @param {Number} [id]
 * @param {"bitcoin" | "bitcoinTestnet" | "bitcoinRegtest"} network
 * @param {Number | undefined} [timeout]
 * @return {Promise<{id: Number, error: boolean, method: "getHeader", data: string, network: "bitcoin" | "bitcoinTestnet" | "bitcoinRegtest"}>}
 */
const getHeader = ({ height = 0, id = Math.random(), network = "", timeout = undefined } = {}) => {
	const method = "getHeader";
	return new Promise(async (resolve) => {
		try {
			if (!(clients.mainClient?.[network]
				&& typeof clients.mainClient[network] === 'object'
				&& clients.mainClient[network]?.blockchainBlock_getBlockHeader)
			){
				const connectRes = await connectToRandomPeer(network, clients.peers[network]);
				if (connectRes.error) return resolve({...connectRes, id, method, network});
			}
			if (!timeout) timeout = _getTimeout();
			const { error, data } = await promiseTimeout(timeout, clients.mainClient[network].blockchainBlock_getBlockHeader(height));
			resolve({ id, error, method, data, network });
		} catch (e) {
			resolve({ id, error: true, method, data: e, network });
		}
	});
}

const getTransactionMerkle = ({ tx_hash, height, id = Math.random(), network = "", timeout = 2000 } = {}) => {
	const method = "getTransactionMerkle";
	return new Promise(async (resolve) => {
		try {
			if (!(clients.mainClient?.[network]
				&& typeof clients.mainClient[network] === 'object'
				&& clients.mainClient[network]?.blockchainTransaction_getMerkle)
			){
				const connectRes = await connectToRandomPeer(network, clients.peers[network]);
				if (connectRes.error) return resolve({...connectRes, id, method, network});
			}
			const { error, data } = await promiseTimeout(timeout, clients.mainClient[network].blockchainTransaction_getMerkle(tx_hash, height));
			resolve({ id, error, method, data, network });
		} catch (e) {
			resolve({ id, error: true, method, data: e, network });
		}
	});
};

const getClient = ({id = Math.random(), network = ""} = {}) => {
	const method = "getClient";
	return new Promise(async (resolve) => {
		try {
			if (!(clients.mainClient?.[clients.network]
				&& typeof clients.mainClient[clients.network] === 'object')
			){
				const connectRes = await connectToRandomPeer(clients.network, clients.peers[clients.network]);
				if (connectRes.error) return resolve({...connectRes, id, method, network: clients.network});
			}
			resolve({ id, error: false, method, data: clients.mainClient[network], network: clients.network });
		} catch (e) {
			resolve({ id, error: true, method, data: e, network: clients.network });
		}
	});
};

const getBlockTransaction = ({ txid = "", id = Math.random(), network = "", timeout = 2000 } = {}) => {
	const method = "getBlockTransaction";
	return new Promise(async (resolve) => {
		try {
			if (!(clients.mainClient?.[network]
				&& typeof clients.mainClient[network] === 'object'
				&& clients.mainClient[network]?.blockchainTransaction_get)
			){
				const connectRes = await connectToRandomPeer(network, clients.peers[network]);
				if (connectRes.error) return resolve({...connectRes, id, method, network});
			}
			const { error, data } = await promiseTimeout(timeout, clients.mainClient[network].blockchainTransaction_get(txid, true));
			resolve({ id, error, method, data, network });
		} catch (e) {
			resolve({ id, error: true, method, data: e, network });
		}
	});
}

module.exports = {
	start,
	stop,
	getClient,
	pingServer,
	getAddressScriptHashBalance,
	getAddressScriptHashBalances,
	listUnspentAddressScriptHashes,
	getAddressScriptHashesHistory,
	getAddressScriptHashesMempool,
	getTransactions,
	getBlockTransaction,
	getPeers,
	subscribeHeader,
	subscribeAddress,
	getFeeEstimate,
	broadcastTransaction,
	getConnectedPeer,
	getHeader,
	getTransactionMerkle,
};
