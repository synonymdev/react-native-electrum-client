const Client = require("./client")
class ElectrumClient extends Client{

    constructor(port, host, protocol, net, tls){
        super(port, host, protocol, net, tls);
    }
    onClose(){
        super.onClose()
        const list = [
            'server.peers.subscribe',
            'blockchain.numblocks.subscribe',
            'blockchain.headers.subscribe',
            'blockchain.address.subscribe'
        ]
        list.forEach(event => {
			if (this.subscribe) this.subscribe.removeAllListeners(event);
		})
    }
    server_version(client_name, protocol_version){
        try {
	        return this.request('server.version', [client_name, protocol_version]);
        } catch (e) {
            return { error: true, data: e };
        }
    }
    server_banner(){
        try {
	        return this.request('server.banner', []);
        } catch (e) {
	        return { error: true, data: e };
        }
    }
	server_ping(){
		try {
			return this.request('server.ping', []);
		} catch (e) {
			return { error: true, data: e };
		}
	}
    serverDonation_address(){
        try {
	        return this.request('server.donation_address', []);
        } catch (e) {
	        return { error: true, data: e };
        }
    }
    serverPeers_subscribe(){
        try {
	        return this.request('server.peers.subscribe', []);
        } catch (e) {
	        return { error: true, data: e };
        }
    }
    blockchainAddress_getBalance(address){
        try {
	        return this.request('blockchain.address.get_balance', [address]);
        } catch (e) {
	        return { error: true, data: e };
        }
    }
    blockchainAddress_getHistory(address){
        try {
	        return this.request('blockchain.address.get_history', [address]);
        } catch (e) {
	        return { error: true, data: e };
        }
    }
    blockchainAddress_getMempool(address){
        try {
	        return this.request('blockchain.address.get_mempool', [address]);
        } catch (e) {
            return { error: true, data: e };
        }
    }
    blockchainAddress_getProof(address){
        try {
            return this.request('blockchain.address.get_proof', [address]);
        } catch (e) {
	        return { error: true, data: e };
        }
    }
    blockchainAddress_listunspent(address){
        try {
            return this.request('blockchain.address.listunspent', [address]);
        } catch (e) {
	        return { error: true, data: e };
        }
    }
    blockchainAddress_subscribe(address){
        try {
            return this.request('blockchain.address.subscribe', [address]);
        } catch (e) {
	        return { error: true, data: e };
        }
    }
    blockchainScripthash_getBalance(scripthash){
        try {
            return this.request('blockchain.scripthash.get_balance', [scripthash]);
        } catch (e) {
	        return { error: true, data: e };
        }
    }
	blockchainScripthash_getHistory(scripthash){
		try {
			return this.request('blockchain.scripthash.get_history', [scripthash]);
		} catch (e) {
			return { error: true, data: e };
		}
	}
    blockchainScripthash_getMempool(scripthash){
        try {
            return this.request('blockchain.scripthash.get_mempool', [scripthash]);
        } catch (e) {
	        return { error: true, data: e };
        }
    }
    blockchainScripthash_listunspent(scripthash){
        try {
            return this.request('blockchain.scripthash.listunspent', [scripthash]);
        } catch (e) {
	        return { error: true, data: e };
        }
    }
    blockchainScripthash_subscribe(scripthash){
        try {
            return this.request('blockchain.scripthash.subscribe', [scripthash]);
        } catch (e) {
	        return { error: true, data: e };
        }
    }
	blockchainBlock_getBlockHeader(height){
		try {
		    return this.request('blockchain.block.header', [height]);
		} catch (e) {
			return { error: true, data: e };
		}
	}
    blockchainEstimatefee(number){
        try {
            return this.request('blockchain.estimatefee', [number]);
        } catch (e) {
	        return { error: true, data: e };
        }
    }
    blockchainHeaders_subscribe(){
        try {
            return this.request('blockchain.headers.subscribe', []);
        } catch (e) {
	        return { error: true, data: e };
        }
    }
    blockchainNumblocks_subscribe(){
        try {
            return this.request('blockchain.numblocks.subscribe', []);
        } catch (e) {
	        return { error: true, data: e };
        }
    }
    blockchain_relayfee(){
        try {
            return this.request('blockchain.relayfee', []);
        } catch (e) {
	        return { error: true, data: e };
        }
    }
    blockchainTransaction_broadcast(rawtx){
        try {
            return this.request('blockchain.transaction.broadcast', [rawtx]);
        } catch (e) {
	        return { error: true, data: e };
        }
    }
    blockchainTransaction_get(tx_hash, verbose=false, merkle=false){
        try {
            return this.request('blockchain.transaction.get', [tx_hash, verbose]);
        } catch (e) {
	        return { error: true, data: e };
        }
    }
    blockchainTransaction_getMerkle(tx_hash, height){
        try {
            return this.request('blockchain.transaction.get_merkle', [tx_hash, height]);
        } catch (e) {
	        return { error: true, data: e };
        }
    }
    blockchainUtxo_getAddress(tx_hash, index){
        try {
            return this.request('blockchain.utxo.get_address', [tx_hash, index]);
        } catch (e) {
	        return { error: true, data: e };
        }
    }

	/**
	 * @param {Object[]} scripthashes - [{ scriptHash: "", address: "", path: "" }]
	 * @param {string} scripthashes[].scriptHash - The address scripthash.
	 * @param {string} scripthashes[].address The address.
	 * @param {string} scripthashes[].path The derivation path of the address.
	 * @returns {Promise<[{ confirmed: Number, unconfirmed: Number, scriptHash: string, address: string }]|{data: *, error: boolean}>}
	 */
	async blockchainScripthashes_getBalance(scripthashes){
		try {
			const result = [];
			await Promise.all(scripthashes.map(async ({ scriptHash = "", address = "", path = "" } = {}) => {
				try {
					const response = await this.request('blockchain.scripthash.get_balance', [scriptHash]);
					const {confirmed, unconfirmed} = response;
					const data = { confirmed, unconfirmed, scriptHash, address, path }
					result.push(data);
				} catch (e) {}
			}));
			return result;
		} catch (e) {
			return { error: true, data: e }
		}
	}
	/**
	 * @param {Object[]} scripthashes - [{ scriptHash: "", address: "", path: "" }]
	 * @param {string} scripthashes[].scriptHash - The address scripthash.
	 * @param {string} scripthashes[].address The address.
	 * @param {string} scripthashes[].path The derivation path of the address.
	 * @returns {Promise<[{ height: Number, tx_hash: string, scriptHash: string, address: string, path: string }]|{data: *, error: boolean}>}
	 */
	async blockchainScripthashes_getHistory(scripthashes){
		try {
			const result = [];
			await Promise.all(scripthashes.map(async ({ scriptHash = "", address = "", path = "" } = {}) => {
				try {
					const response = await this.request('blockchain.scripthash.get_history', [scriptHash]);
					const responseLength = response.length;
					if (responseLength > 0) {
						response.map((res) => {
							try {
								const { height, tx_hash } = res;
								const data = { height, tx_hash, scriptHash, address, path }
								result.push(data);
							} catch (e) {}
						});
					}
				} catch (e) {}
			}));
			return result;
		} catch (e) {
			return { error: true, data: e }
		}
	}
	/**
	 * @param {Object[]} scripthashes - [{ scriptHash: "", address: "", path: "" }]
	 * @param {string} scripthashes[].scriptHash - The address scripthash.
	 * @param {string} scripthashes[].address The address.
	 * @param {string} scripthashes[].path The derivation path of the address.
	 * @returns {Promise<[]|{data: *, error: boolean}>}
	 */
	async blockchainScripthashes_getMempool(scripthashes){
		try {
			const result = [];
			await Promise.all(scripthashes.map(async ({ scriptHash = "", address = "", path = "" } = {}) => {
				try {
					const response = await this.request('blockchain.scripthash.get_mempool', [scriptHash]);
					const responseLength = response.length;
					if (responseLength > 0) {
						response.map((res) => {
							try {
								const { height, tx_hash } = res;
								const data = { height, tx_hash, scriptHash, address, path }
								result.push(data);
							} catch (e) {}
						});
					}
				} catch (e) {}
			}));
			return result;
		} catch (e) {
			return { error: true, data: e }
		}
	}
	/**
	 * @param {Object[]} scripthashes - [{ scriptHash: "", address: "", path: "" }]
	 * @param {string} scripthashes[].scriptHash - The address scripthash.
	 * @param {string} scripthashes[].address The address.
	 * @param {string} scripthashes[].path The derivation path of the address.
	 * @returns {Promise<[{ height: 0, tx_hash: "", tx_pos: 0, value: 0, scriptHash: "", address: "", path: "" }]|{data: *, error: boolean}>}
	 */
	async blockchainScripthashes_listunspent(scripthashes){
		try {
			const result = [];
			await Promise.all(scripthashes.map(async (scripthashData) => {
				try {
					const { scriptHash, address, path } = scripthashData;
					const response = await this.request('blockchain.scripthash.listunspent', [scriptHash]);
					const responseLength = response.length;
					if (responseLength > 0) {
						response.map((res) => {
							try {
								const {height, tx_hash, tx_pos, value} = res;
								const data = {height, tx_hash, tx_pos, value, scriptHash, address, path};
								result.push(data);
							} catch (e) {}
						});
					}
				} catch (e) {}
			}));
			return result;
		} catch (e) {
			return { error: true, data: e }
		}
	}
	/**
	 * @param {Object[]} tx_hashes - [{ tx_hash: string }]
	 * @param {string} tx_hashes[].tx_hash - The transaction's hash.
	 * @param {boolean} verbose - The address scripthash.
	 * @param {boolean} merkle
	 * @returns {Promise<[]|{data: *, error: boolean}>}
	 */
	async blockchainTransactions_get(tx_hashes, verbose= false, merkle= false){
		try {
			const result = [];
			await Promise.all(tx_hashes.map(async (tx) => {
				try {
					const response = await this.request('blockchain.transaction.get', [tx.tx_hash, verbose]);
					if (response) {
						try {
							const data = Object.assign(tx, response);
							result.push(data);
						} catch (e) {}
					}
				} catch (e) {}
			}));
			return result;
		} catch (e) {
			return { error: true, data: e }
		}
	}

	requestBatch(method, params, secondParam) {
		const parentPromise = super.requestBatch(method, params, secondParam);
		return parentPromise.then(response => response);
	}
	blockchainScripthash_getBalanceBatch(scripthashes) {
		return this.requestBatch('blockchain.scripthash.get_balance', scripthashes);
	}
	blockchainScripthash_listunspentBatch(scripthashes) {
		return this.requestBatch('blockchain.scripthash.listunspent', scripthashes);
	}
	blockchainScripthash_getHistoryBatch(scripthashes) {
		return this.requestBatch('blockchain.scripthash.get_history', scripthashes);
	}
	blockchainTransaction_getBatch(tx_hashes, verbose) {
		return this.requestBatch('blockchain.transaction.get', tx_hashes, verbose);
	}
	blockchainScripthash_getMempoolBatch(scripthashes){
		return this.requestBatch('blockchain.scripthash.get_mempool', scripthashes);
	}
}

module.exports = ElectrumClient
