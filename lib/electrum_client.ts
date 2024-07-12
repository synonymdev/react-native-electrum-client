import Client from './client';
import { Balance, EProtocol, Net, Tls } from './types';

type TScriptHash = {
  scriptHash: string;
  address: string;
  path: string;
};

type TTxHash = {
  tx_hash: string;
};

class ElectrumClient extends Client {
  constructor(
    port: number,
    host: string,
    protocol: EProtocol,
    net: Net,
    tls: Tls,
  ) {
    super(port, host, protocol, net, tls);
  }

  onClose() {
    super.onClose();
    const list = [
      'server.peers.subscribe',
      'blockchain.numblocks.subscribe',
      'blockchain.headers.subscribe',
      'blockchain.address.subscribe',
    ];
    list.forEach((event) => {
      if (this.subscribe) this.subscribe.removeAllListeners(event);
    });
  }

  server_version(client_name: string, protocol_version: string) {
    try {
      return this.request('server.version', [client_name, protocol_version]);
    } catch (e) {
      return { data: e, error: true };
    }
  }

  server_banner() {
    try {
      return this.request('server.banner', []);
    } catch (e) {
      return { data: e, error: true };
    }
  }

  server_ping() {
    try {
      return this.request('server.ping', []);
    } catch (e) {
      return { data: e, error: true };
    }
  }

  serverDonation_address() {
    try {
      return this.request('server.donation_address', []);
    } catch (e) {
      return { data: e, error: true };
    }
  }

  serverPeers_subscribe() {
    try {
      return this.request('server.peers.subscribe', []);
    } catch (e) {
      return { data: e, error: true };
    }
  }

  blockchainAddress_getBalance(address: string) {
    try {
      return this.request('blockchain.address.get_balance', [address]);
    } catch (e) {
      return { data: e, error: true };
    }
  }

  blockchainAddress_getHistory(address: string) {
    try {
      return this.request('blockchain.address.get_history', [address]);
    } catch (e) {
      return { data: e, error: true };
    }
  }

  blockchainAddress_getMempool(address: string) {
    try {
      return this.request('blockchain.address.get_mempool', [address]);
    } catch (e) {
      return { data: e, error: true };
    }
  }

  blockchainAddress_getProof(address: string) {
    try {
      return this.request('blockchain.address.get_proof', [address]);
    } catch (e) {
      return { data: e, error: true };
    }
  }

  blockchainAddress_listunspent(address: string) {
    try {
      return this.request('blockchain.address.listunspent', [address]);
    } catch (e) {
      return { data: e, error: true };
    }
  }

  blockchainAddress_subscribe(address: string) {
    try {
      return this.request('blockchain.address.subscribe', [address]);
    } catch (e) {
      return { data: e, error: true };
    }
  }

  /**
   * @param {string} scripthash - The script hash as a hexadecimal string.
   */
  blockchainScripthash_getBalance(scripthash: string) {
    try {
      return this.request('blockchain.scripthash.get_balance', [scripthash]);
    } catch (e) {
      return { data: e, error: true };
    }
  }

  /**
   * @param {string} scripthash - The script hash as a hexadecimal string.
   */
  blockchainScripthash_getHistory(scripthash: string) {
    try {
      return this.request('blockchain.scripthash.get_history', [scripthash]);
    } catch (e) {
      return { data: e, error: true };
    }
  }

  blockchainScripthash_getMempool(scripthash: string) {
    try {
      return this.request('blockchain.scripthash.get_mempool', [scripthash]);
    } catch (e) {
      return { data: e, error: true };
    }
  }

  blockchainScripthash_listunspent(scripthash: string) {
    try {
      return this.request('blockchain.scripthash.listunspent', [scripthash]);
    } catch (e) {
      return { data: e, error: true };
    }
  }

  blockchainScripthash_subscribe(scripthash: string) {
    try {
      return this.request('blockchain.scripthash.subscribe', [scripthash]);
    } catch (e) {
      return { data: e, error: true };
    }
  }

  blockchainBlock_getBlockHeader(height: number) {
    try {
      return this.request('blockchain.block.header', [height]);
    } catch (e) {
      return { data: e, error: true };
    }
  }

  /**
   * @param {number} blocks - How many blocks the transaction may wait before being included.
   */
  blockchainEstimatefee(blocks: number) {
    try {
      return this.request('blockchain.estimatefee', [blocks]);
    } catch (e) {
      return { data: e, error: true };
    }
  }

  blockchainHeaders_subscribe() {
    try {
      return this.request('blockchain.headers.subscribe', []);
    } catch (e) {
      return { data: e, error: true };
    }
  }

  blockchainNumblocks_subscribe() {
    try {
      return this.request('blockchain.numblocks.subscribe', []);
    } catch (e) {
      return { data: e, error: true };
    }
  }

  blockchain_relayfee() {
    try {
      return this.request('blockchain.relayfee', []);
    } catch (e) {
      return { data: e, error: true };
    }
  }

  blockchainTransaction_broadcast(rawtx: string) {
    try {
      return this.request('blockchain.transaction.broadcast', [rawtx]);
    } catch (e) {
      return { data: e, error: true };
    }
  }

  blockchainTransaction_get(tx_hash: string, verbose = false) {
    try {
      return this.request('blockchain.transaction.get', [tx_hash, verbose]);
    } catch (e) {
      return { data: e, error: true };
    }
  }

  blockchainTransaction_getMerkle(tx_hash: string, height: number) {
    try {
      return this.request('blockchain.transaction.get_merkle', [
        tx_hash,
        height,
      ]);
    } catch (e) {
      return { data: e, error: true };
    }
  }

  blockchainUtxo_getAddress(tx_hash: string, index: number) {
    try {
      return this.request('blockchain.utxo.get_address', [tx_hash, index]);
    } catch (e) {
      return { data: e, error: true };
    }
  }

  /**
   * @param {TScriptHash[]} scripthashes
   * @param {string} scripthashes[].scriptHash - The address scripthash.
   * @param {string} scripthashes[].address The address.
   * @param {string} scripthashes[].path The derivation path of the address.
   * @returns {Promise<[{ confirmed: Number, unconfirmed: Number, scriptHash: string, address: string }]|{data: *, error: boolean}>}
   */
  async blockchainScripthashes_getBalance(scripthashes: TScriptHash[]) {
    try {
      const result: any = [];
      await Promise.all(
        scripthashes.map(
          async ({ scriptHash = '', address = '', path = '' }) => {
            try {
              const response = await this.request<Balance>(
                'blockchain.scripthash.get_balance',
                [scriptHash],
              );
              const { confirmed, unconfirmed } = response;
              const data = {
                confirmed,
                unconfirmed,
                scriptHash,
                address,
                path,
              };
              result.push(data);
            } catch (e) {}
          },
        ),
      );
      return result;
    } catch (e) {
      return { data: e, error: true };
    }
  }

  /**
   * @param {TScriptHash[]} scripthashes - [{ scriptHash: "", address: "", path: "" }]
   * @param {string} scripthashes[].scriptHash - The address scripthash.
   * @param {string} scripthashes[].address The address.
   * @param {string} scripthashes[].path The derivation path of the address.
   * @returns {Promise<[{ height: Number, tx_hash: string, scriptHash: string, address: string, path: string }]|{data: *, error: boolean}>}
   */
  async blockchainScripthashes_getHistory(scripthashes: TScriptHash[]) {
    try {
      const result = [];
      await Promise.all(
        scripthashes.map(
          async ({ scriptHash = '', address = '', path = '' }) => {
            try {
              const response = await this.request(
                'blockchain.scripthash.get_history',
                [scriptHash],
              );
              const responseLength = response.length;
              if (responseLength > 0) {
                response.map((res) => {
                  try {
                    const { height, tx_hash } = res;
                    const data = { height, tx_hash, scriptHash, address, path };
                    result.push(data);
                  } catch (e) {}
                });
              }
            } catch (e) {}
          },
        ),
      );
      return result;
    } catch (e) {
      return { data: e, error: true };
    }
  }

  /**
   * @param {TScriptHash[]} scripthashes
   * @param {string} scripthashes[].scriptHash - The address scripthash.
   * @param {string} scripthashes[].address The address.
   * @param {string} scripthashes[].path The derivation path of the address.
   * @returns {Promise<[]|{data: *, error: boolean}>}
   */
  async blockchainScripthashes_getMempool(scripthashes: TScriptHash[]) {
    try {
      const result = [];
      await Promise.all(
        scripthashes.map(
          async ({ scriptHash = '', address = '', path = '' }) => {
            try {
              const response = await this.request(
                'blockchain.scripthash.get_mempool',
                [scriptHash],
              );
              const responseLength = response.length;
              if (responseLength > 0) {
                response.map((res) => {
                  try {
                    const { height, tx_hash } = res;
                    const data = { height, tx_hash, scriptHash, address, path };
                    result.push(data);
                  } catch (e) {}
                });
              }
            } catch (e) {}
          },
        ),
      );
      return result;
    } catch (e) {
      return { data: e, error: true };
    }
  }

  /**
   * @param {TScriptHash[]} scripthashes
   * @param {string} scripthashes[].scriptHash - The address scripthash.
   * @param {string} scripthashes[].address The address.
   * @param {string} scripthashes[].path The derivation path of the address.
   * @returns {Promise<[{ height: 0, tx_hash: "", tx_pos: 0, value: 0, scriptHash: "", address: "", path: "" }]|{data: *, error: boolean}>}
   */
  async blockchainScripthashes_listunspent(scripthashes: TScriptHash[]) {
    try {
      const result = [];
      await Promise.all(
        scripthashes.map(async (scripthashData) => {
          try {
            const { scriptHash, address, path } = scripthashData;
            const response = await this.request(
              'blockchain.scripthash.listunspent',
              [scriptHash],
            );
            const responseLength = response.length;
            if (responseLength > 0) {
              response.map((res) => {
                try {
                  const { height, tx_hash, tx_pos, value } = res;
                  const data = {
                    height,
                    tx_hash,
                    tx_pos,
                    value,
                    scriptHash,
                    address,
                    path,
                  };
                  result.push(data);
                } catch (e) {}
              });
            }
          } catch (e) {}
        }),
      );
      return result;
    } catch (e) {
      return { data: e, error: true };
    }
  }

  /**
   * @param {TTxHash[]} tx_hashes
   * @param {boolean} verbose - The address scripthash.
   * @param {boolean} merkle
   * @returns {Promise<[]|{data: *, error: boolean}>}
   */
  async blockchainTransactions_get(
    tx_hashes: TTxHash[],
    verbose = false,
    merkle = false,
  ) {
    try {
      const result = [];
      await Promise.all(
        tx_hashes.map(async (tx) => {
          try {
            const response = await this.request('blockchain.transaction.get', [
              tx.tx_hash,
              verbose,
            ]);
            if (response) {
              try {
                const data = Object.assign(tx, response);
                result.push(data);
              } catch (e) {}
            }
          } catch (e) {}
        }),
      );
      return result;
    } catch (e) {
      return { data: e, error: true };
    }
  }

  requestBatch(
    method: string,
    params: TScriptHash[] | TTxHash[],
    secondParam?: boolean,
  ) {
    const parentPromise = super.requestBatch(method, params, secondParam);
    return parentPromise.then((response) => response);
  }

  blockchainScripthash_getBalanceBatch(scripthashes: TScriptHash[]) {
    return this.requestBatch('blockchain.scripthash.get_balance', scripthashes);
  }

  blockchainScripthash_listunspentBatch(scripthashes: TScriptHash[]) {
    return this.requestBatch('blockchain.scripthash.listunspent', scripthashes);
  }

  blockchainScripthash_getHistoryBatch(scripthashes: TScriptHash[]) {
    return this.requestBatch('blockchain.scripthash.get_history', scripthashes);
  }

  blockchainTransaction_getBatch(tx_hashes: TTxHash[], verbose: boolean) {
    return this.requestBatch('blockchain.transaction.get', tx_hashes, verbose);
  }

  blockchainScripthash_getMempoolBatch(scripthashes: TScriptHash[]) {
    return this.requestBatch('blockchain.scripthash.get_mempool', scripthashes);
  }
}

export default ElectrumClient;
