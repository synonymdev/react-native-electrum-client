import ElectrumClient from '../lib/electrum_client';
import { ENetwork, EProtocol, Net, Tls } from '../lib/types';
// import client from './client';
import clients, { TPeer } from './clients';
import defaultPeers from './peers.json';

// type TDefaultPeer = { host: string; tcp: number; ssl: number };

let electrumKeepAlive = () => null;
let electrumKeepAliveInterval = 30000;

const _getTimeout = ({ arr = [], timeout = 2000 } = {}) => {
  try {
    // if (!Array.isArray(arr)) {
    //   arr = _attemptToGetArray(arr);
    // }
    if (arr.length > 0) {
      return ((arr.length * timeout) / 2) | timeout;
    }
    return timeout;
  } catch {
    return timeout;
  }
};

// const _attemptToGetArray = (item: any[] | { data?: any }) => {
//   try {
//     if (Array.isArray(item)) return item;
//     if ('data' in item) {
//       if (Array.isArray(item.data)) return item.data;
//       if (typeof item.data === 'object') return Object.values(item.data);
//     }
//     return [];
//   } catch {
//     return [];
//   }
// };

const pauseExecution = (duration = 500): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(resolve, duration);
  });
};

const promiseTimeout = (ms: number, promise) => {
  let id: NodeJS.Timeout;
  let timeout = new Promise((resolve) => {
    id = setTimeout(() => {
      resolve({ error: true, data: 'Timed Out.' });
    }, ms);
  });

  return Promise.race([promise, timeout]).then((result) => {
    clearTimeout(id);
    try {
      if ('error' in result && 'data' in result) return result;
    } catch {}
    return { error: false, data: result };
  });
};

const getDefaultPeers = (network: ENetwork, protocol: EProtocol) => {
  return defaultPeers[network].map((peer) => {
    return { ...peer, protocol };
  });
};

const pingServer = async ({ id = Math.random() } = {}) => {
  const method = 'pingServer';
  const client = clients.mainClient[clients.network];

  try {
    if (!client) {
      const connectRes = await connectToRandomPeer(
        clients.network,
        clients.peers[clients.network],
      );
      if (connectRes.error) {
        return { ...connectRes, id, method, network: clients.network };
      }
    }
    const { data, error } = await promiseTimeout(
      _getTimeout(),
      client!.server_ping(),
    );
    return { id, method, network: clients.network, data, error };
  } catch (e) {
    return { id, method, network: clients.network, data: e, error: true };
  }
};

// peers = A list of peers acquired from default electrum servers using the getPeers method.
// customPeers = A list of peers added by the user to connect to by default in lieu of the default peer list.
const start = async (
  {
    id = Math.random(),
    network = ENetwork.bitcoin,
    peers = [],
    customPeers = [],
    net,
    tls,
  }: {
    id?: number;
    network?: ENetwork;
    peers?: TPeer[];
    customPeers?: TPeer[];
    net?: Net;
    tls?: Tls;
  } = {},
  keepAliveInterval?: number,
) => {
  const method = 'connectToPeer';
  electrumKeepAliveInterval = keepAliveInterval || electrumKeepAliveInterval;

  try {
    // Clear/Remove any previous keep-alive message.
    try {
      clearInterval(electrumKeepAlive);
    } catch {}
    clients.network = network;

    // Attempt to connect to specified peer
    let connectionResponse = { data: '', error: true };
    if (customPeers[0]) {
      const { host, protocol } = customPeers[0];
      const port = customPeers[0][protocol];
      connectionResponse = await connectToPeer({
        port,
        host,
        protocol,
        network,
        net,
        tls,
      });
    } else {
      //Attempt to connect to random peer if none specified
      connectionResponse = await connectToRandomPeer(
        network,
        peers,
        EProtocol.ssl,
        net,
        tls,
      );
    }
    return {
      ...connectionResponse,
      id,
      method,
      customPeers,
      network,
    };
  } catch (e) {
    console.log(e);
    return { error: true, method, data: e };
  }
};

const connectToPeer = async ({
  port = 50002,
  host,
  protocol = EProtocol.ssl,
  network = ENetwork.bitcoin,
  net,
  tls,
}: {
  port?: number;
  host: string;
  protocol?: EProtocol;
  network?: ENetwork;
  net?: Net;
  tls?: Tls;
}) => {
  try {
    clients.network = network;
    let needToConnect =
      !clients.mainClient[network] ||
      clients.peer[network].host !== host ||
      clients.peer[network].port !== port ||
      clients.peer[network].protocol !== protocol;
    let connectionResponse = { data: clients.peer[network], error: false };
    if (!needToConnect) {
      // Ensure the server is still alive
      const pingResponse = await pingServer();
      if (pingResponse.error) {
        await disconnectFromPeer({ network });
        needToConnect = true;
      }
    }
    if (needToConnect) {
      clients.mainClient[network] = new ElectrumClient(
        port,
        host,
        protocol,
        net,
        tls,
      );
      connectionResponse = await promiseTimeout(
        _getTimeout(),
        clients.mainClient[network].connect(),
      );
      if (connectionResponse.error) {
        return connectionResponse;
      }
      /*
       * The scripthash doesn't have to be valid.
       * We're simply testing if the server will respond to a batch request.
       */
      const scriptHash =
        '77ca78f9a84b48041ad71f7cc6ff6c33460c25f0cb99f558f9813ed9e63727dd';
      const testResponses = await Promise.all([
        pingServer(),
        getAddressScriptHashBalances({ network, scriptHashes: [scriptHash] }),
      ]);
      if (testResponses[0].error || testResponses[1].error) {
        return { data: '', error: true };
      }
      try {
        // Clear/Remove Electrum's keep-alive message.
        clearInterval(electrumKeepAlive);
        // Start Electrum's keep-alive function. It’s sent every minute as a keep-alive message.
        electrumKeepAlive = setInterval(async () => {
          try {
            pingServer({ id: Math.random() });
          } catch {}
        }, electrumKeepAliveInterval);
      } catch (e) {}
      clients.peer[network] = { port, host, protocol };
    }
    return connectionResponse;
  } catch (e) {
    return { error: true, data: e };
  }
};

const connectToRandomPeer = async (
  network: ENetwork,
  peers: TPeer[] = [],
  protocol: EProtocol = EProtocol.ssl,
  net?: Net,
  tls?: Tls,
) => {
  const method = 'connectToRandomPeer';

  // Peers can be found in peers.json.
  // Additional Peers can be located here in servers.json & servers_testnet.json for reference: https://github.com/spesmilo/electrum/tree/master/electrum
  if (peers.length > 0) {
    // Update peer list
    clients.peers[network] = peers;
  } else {
    // Set the saved peer list
    peers = clients.peers[network];
  }
  if (peers.length === 0) {
    // Use the default peer list for a connection if no other peers were passed down and no saved peer list is present.
    peers = getDefaultPeers(network, protocol);
  }
  const initialPeerLength = peers.length; //Acquire length of our default peers.
  // Attempt to connect to a random default peer. Continue to iterate through default peers at random if unable to connect.
  for (let i = 0; i <= initialPeerLength; i++) {
    try {
      const randomIndex = peers.length * Math.random() || 0;
      const peer = peers[randomIndex];
      let port = 50002;
      let host = '';
      if (hasPeers) {
        port = peer.port;
        host = peer.host;
        protocol = peer.protocol;
      } else {
        port = peer[peer.protocol];
        host = peer.host;
        protocol = peer.protocol;
      }
      const connectionResponse = await connectToPeer({
        port,
        host,
        protocol,
        network,
        net,
        tls,
      });
      if (connectionResponse.error === false && connectionResponse.data) {
        return {
          method,
          network,
          data: connectionResponse.data,
          error: connectionResponse.error,
        };
      } else {
        // clients.mainClient[network]?.close();
        clients.mainClient[network] = undefined;
        if (peers.length === 1) {
          return {
            method,
            network,
            data: connectionResponse.data,
            error: true,
          };
        }
        peers.splice(randomIndex, 1);
      }
    } catch (e) {
      console.log(e);
    }
  }
  return {
    method,
    data: 'Unable to connect to any peer.',
    error: true,
  };
};

const stop = async ({ network = ENetwork.bitcoin } = {}) => {
  try {
    //Clear/Remove Electrum's keep-alive message.
    clearInterval(electrumKeepAlive);
    //Disconnect from peer
    const response = await disconnectFromPeer({ network });
    return response;
  } catch (e) {
    return { error: true, data: e };
  }
};

const disconnectFromPeer = async ({
  id = Math.random(),
  network = ENetwork.bitcoin,
} = {}) => {
  const method = 'disconnectFromPeer';
  try {
    if (!clients.mainClient[network]) {
      // No peer to disconnect from...
      return {
        id,
        network,
        method,
        data: 'No peer to disconnect from.',
        error: false,
      };
    }
    // Attempt to disconnect from peer...
    clients.mainClient[network]!.close();
    await pauseExecution();
    // Reset the client.
    clients.mainClient[network] = undefined;
    clients.peer[network] = { port: 0, host: '', protocol: '' };
    clients.peers[network] = [];
    clients.subscribedAddresses[network] = [];
    clients.subscribedHeaders[network] = false;
    clients.onAddressReceive[network] = undefined;
    clients.network = ENetwork.bitcoin;

    return {
      id,
      method,
      network,
      data: 'Disconnected.',
      error: false,
    };
  } catch (e) {
    return { error: true, id, method: 'disconnectFromPeer', data: e };
  }
};

const getAddressScriptHashBalance = async ({
  id = Math.random(),
  network = ENetwork.bitcoin,
  scriptHash,
}: {
  id?: number;
  network?: ENetwork;
  scriptHash: string;
}) => {
  const method = 'getAddressScriptHashBalance';

  try {
    if (!clients.mainClient[network]) {
      const connectRes = await connectToRandomPeer(
        network,
        clients.peers[network],
      );
      if (connectRes.error) {
        return { ...connectRes, id, scriptHash, method };
      }
    }
    const { data, error } = await promiseTimeout(
      _getTimeout(),
      clients.mainClient[network].blockchainScripthash_getBalance(scriptHash),
    );
    return { id, error, method, data, scriptHash, network };
  } catch (e) {
    console.log(e);
    return { id, method, network, data: e, error: true };
  }
};

const getPeers = async ({
  id = Math.random(),
  network = ENetwork.bitcoin,
} = {}) => {
  const method = 'getPeers';

  try {
    if (!clients.mainClient[network]) {
      const connectRes = await connectToRandomPeer(
        network,
        clients.peers[network],
      );
      if (connectRes.error) {
        return { ...connectRes, id, method };
      }
    }
    const data = await clients.mainClient[network].serverPeers_subscribe();
    return { id, method, network, data, error: false };
  } catch (e) {
    console.log(e);
    return { id, method, network, data: null, error: true };
  }
};

const getConnectedPeer = (network = ENetwork.bitcoin) => {
  return clients.peer[network];
};

const subscribeHeader = async ({
  id = 'subscribeHeader',
  network = ENetwork.bitcoin,
  onReceive = () => null,
} = {}) => {
  const method = 'subscribeHeader';
  try {
    if (!clients.mainClient[network]) {
      const connectRes = await connectToRandomPeer(
        network,
        clients.peers[network],
      );
      if (connectRes.error) {
        return { ...connectRes, id, method, network };
      }
    }
    if (clients.subscribedHeaders[network] === true)
      return { id, error: false, method, data: 'Already Subscribed.', network };
    const res = await promiseTimeout(
      10000,
      clients.mainClient[network].subscribe.on(
        'blockchain.headers.subscribe',
        onReceive,
      ),
    );
    if (res.error) return { ...res, id, method };
    const response = await promiseTimeout(
      10000,
      clients.mainClient[network].blockchainHeaders_subscribe(),
    );
    if (!response.error) clients.subscribedHeaders[network] = true;
    return { ...response, id, method };
  } catch (e) {
    return { id, method, network, data: e, error: true };
  }
};

const subscribeAddress = async ({
  id = Math.random(),
  network = ENetwork.bitcoin,
  scriptHash = '',
  onReceive = undefined,
} = {}) => {
  const method = 'subscribeAddress';
  try {
    if (!clients.mainClient[network]) {
      const connectRes = await connectToRandomPeer(
        network,
        clients.peers[network],
      );
      if (connectRes.error) {
        return { ...connectRes, id, method };
      }
    }

    // Set onAddressReceive if wasn't previously.
    if (onReceive && !clients.onAddressReceive[network]) {
      clients.onAddressReceive[network] = onReceive;
      const res = await promiseTimeout(
        10000,
        clients.mainClient[network].subscribe.on(
          'blockchain.scripthash.subscribe',
          clients.onAddressReceive[network],
        ),
      );
      if (res.error) {
        return { ...res, id, method };
      }
    }

    //Ensure this address is not already subscribed
    if (clients.subscribedAddresses[network].includes(scriptHash))
      return { id, error: false, method, data: 'Already Subscribed.' };
    const response = await promiseTimeout(
      10000,
      clients.mainClient[network].blockchainScripthash_subscribe(scriptHash),
    );
    if (!response.error) clients.subscribedAddresses[network].push(scriptHash);
    return { ...response, id, method };
  } catch (e) {
    return { id, error: true, method, data: e };
  }
};

const getFeeEstimate = async ({
  id = Math.random(),
  network = ENetwork.bitcoin,
  blocksWillingToWait = 8,
} = {}) => {
  const method = 'getFeeEstimate';

  try {
    if (!clients.mainClient[network]) {
      const connectRes = await connectToRandomPeer(
        network,
        clients.peers[network],
      );
      if (connectRes.error) {
        return { ...connectRes, id, method, network };
      }
    }
    const response = await promiseTimeout(
      _getTimeout(),
      clients.mainClient[network].blockchainEstimatefee(blocksWillingToWait),
    );
    return { ...response, id, method, network };
  } catch (e) {
    console.log(e);
    return { id, method, network, data: e, error: true };
  }
};

const getAddressScriptHashBalances = async ({
  id = Math.random(),
  network = ENetwork.bitcoin,
  scriptHashes = [],
}: {
  id?: number;
  network?: ENetwork;
  scriptHashes?: string[];
} = {}) => {
  const method = 'getAddressScriptHashBalances';
  try {
    if (!clients.mainClient[network]) {
      const connectRes = await connectToRandomPeer(
        network,
        clients.peers[network],
      );
      if (connectRes.error) {
        return { ...connectRes, id, method, network };
      }
    }
    const timeout = _getTimeout({ arr: scriptHashes });
    const response = await promiseTimeout(
      timeout,
      clients.mainClient[network].blockchainScripthash_getBalanceBatch(
        scriptHashes,
      ),
    );
    return { ...response, id, method, network };
  } catch (e) {
    console.log(e);
    return { id, method, network, data: e, error: true };
  }
};

const listUnspentAddressScriptHashes = async ({
  id = Math.random(),
  network = ENetwork.bitcoin,
  scriptHashes = [],
  timeout = undefined,
} = {}) => {
  const method = 'listUnspentAddressScriptHashes';

  try {
    if (!clients.mainClient[network]) {
      const connectRes = await connectToRandomPeer(
        network,
        clients.peers[network],
      );
      if (connectRes.error) {
        return { ...connectRes, id, method, network };
      }
    }
    if (!timeout) {
      timeout = _getTimeout({ arr: scriptHashes });
    }
    const { data, error } = await promiseTimeout(
      timeout,
      clients.mainClient[network].blockchainScripthash_listunspentBatch(
        scriptHashes,
      ),
    );
    return { id, method, network, data, error };
  } catch (e) {
    console.log(e);
    return { id, method, network, data: e, error: true };
  }
};

const getAddressScriptHashesHistory = async ({
  id = Math.random(),
  network = ENetwork.bitcoin,
  scriptHashes = [],
  timeout = undefined,
} = {}) => {
  const method = 'getScriptHashesHistory';

  try {
    if (!clients.mainClient[network]) {
      const connectRes = await connectToRandomPeer(
        network,
        clients.peers[network],
      );
      if (connectRes.error) {
        return { ...connectRes, id, method, network };
      }
    }
    if (!timeout) {
      timeout = _getTimeout({ arr: scriptHashes });
    }
    const { data, error } = await promiseTimeout(
      timeout,
      clients.mainClient[network].blockchainScripthash_getHistoryBatch(
        scriptHashes,
      ),
    );
    return { id, method, network, data, error };
  } catch (e) {
    console.log(e);
    return { id, method, network, data: e, error: true };
  }
};

const getAddressScriptHashesMempool = async ({
  id = Math.random(),
  network = ENetwork.bitcoin,
  timeout = undefined,
  scriptHashes,
}: {
  id?: number;
  network?: ENetwork;
  timeout?: number;
  scriptHashes: string[];
}) => {
  const method = 'getAddressScriptHashesMempool';

  try {
    if (!clients.mainClient[network]) {
      const connectRes = await connectToRandomPeer(
        network,
        clients.peers[network],
      );
      if (connectRes.error) {
        return { ...connectRes, id, method, network };
      }
    }
    if (!timeout) {
      timeout = _getTimeout({ arr: scriptHashes });
    }
    const { data, error } = await promiseTimeout(
      timeout,
      clients.mainClient[network].blockchainScripthash_getMempoolBatch(
        scriptHashes,
      ),
    );
    return { id, method, network, data, error };
  } catch (e) {
    console.log(e);
    return { id, method, network, data: e, error: true };
  }
};

const getTransactions = async ({
  id = Math.random(),
  network = ENetwork.bitcoin,
  timeout = undefined,
  txHashes,
}: {
  id?: number;
  network?: ENetwork;
  timeout?: number;
  txHashes: string[];
}) => {
  const method = 'getTransactions';

  try {
    if (!clients.mainClient[network]) {
      const connectRes = await connectToRandomPeer(
        network,
        clients.peers[network],
      );
      if (connectRes.error) {
        return { ...connectRes, id, method, network };
      }
    }
    if (!timeout) {
      timeout = _getTimeout({ arr: txHashes });
    }
    const { data, error } = await promiseTimeout(
      timeout,
      clients.mainClient[network].blockchainTransaction_getBatch(
        txHashes,
        true,
      ),
    );
    return { id, method, network, data, error };
  } catch (e) {
    console.log(e);
    return { id, method, network, data: e, error: true };
  }
};

const broadcastTransaction = async ({
  id = Math.random(),
  network = ENetwork.bitcoin,
  timeout = undefined,
  rawTx,
}: {
  id?: number;
  network?: ENetwork;
  timeout?: number;
  rawTx: string;
}) => {
  const method = 'broadcastTransaction';

  try {
    if (!clients.mainClient[network]) {
      const connectRes = await connectToRandomPeer(
        network,
        clients.peers[network],
      );
      if (connectRes.error) {
        return { ...connectRes, id, method, network };
      }
    }
    if (!timeout) {
      timeout = _getTimeout();
    }
    const { data, error } = await promiseTimeout(
      timeout,
      clients.mainClient[network].blockchainTransaction_broadcast(rawTx),
    );
    return { id, method, network, data, error };
  } catch (e) {
    return { id, method, network, data: e, error: true };
  }
};

/**
 * Returns header hex of the provided height and network.
 * @param {number} [height]
 * @param {number} [id]
 * @param {ENetwork} network
 * @param {number | undefined} [timeout]
 * @return {Promise<{id: number, error: boolean, method: "getHeader", data: string, network: "bitcoin" | "bitcoinTestnet" | "bitcoinRegtest"}>}
 */
const getHeader = async ({
  id = Math.random(),
  network = ENetwork.bitcoin,
  timeout = undefined,
  height = 0,
}: {
  id?: number;
  network?: ENetwork;
  timeout?: number;
  height?: number;
} = {}) => {
  const method = 'getHeader';
  try {
    if (!clients.mainClient[network]) {
      const connectRes = await connectToRandomPeer(
        network,
        clients.peers[network],
      );
      if (connectRes.error) {
        return { ...connectRes, id, method, network };
      }
    }
    if (!timeout) {
      timeout = _getTimeout();
    }
    const { data, error } = await promiseTimeout(
      timeout,
      clients.mainClient[network].blockchainBlock_getBlockHeader(height),
    );
    return { id, method, network, data, error };
  } catch (e) {
    return { id, method, network, data: e, error: true };
  }
};

const getTransactionMerkle = async ({
  id = Math.random(),
  network = ENetwork.bitcoin,
  timeout = 2000,
  tx_hash,
  height,
}: {
  id?: number;
  network?: ENetwork;
  tx_hash: string;
  height: number;
  timeout?: number;
}) => {
  const method = 'getTransactionMerkle';

  try {
    if (!clients.mainClient[network]) {
      const connectRes = await connectToRandomPeer(
        network,
        clients.peers[network],
      );
      if (connectRes.error) {
        return { ...connectRes, id, method, network };
      }
    }
    const { data, error } = await promiseTimeout(
      timeout,
      clients.mainClient[network].blockchainTransaction_getMerkle(
        tx_hash,
        height,
      ),
    );
    return { id, method, network, data, error };
  } catch (e) {
    return { id, method, network, data: e, error: true };
  }
};

const getClient = async ({
  id = Math.random(),
  network = ENetwork.bitcoin,
} = {}) => {
  const method = 'getClient';
  try {
    if (
      !(
        clients.mainClient[clients.network] &&
        typeof clients.mainClient[clients.network] === 'object'
      )
    ) {
      const connectRes = await connectToRandomPeer(
        clients.network,
        clients.peers[clients.network],
      );
      if (connectRes.error)
        return {
          ...connectRes,
          id,
          method,
          network: clients.network,
        };
    }
    return {
      id,
      method,
      network: clients.network,
      data: clients.mainClient[network],
      error: false,
    };
  } catch (e) {
    return { id, method, network, data: e, error: true };
  }
};

const getBlockTransaction = async ({
  id = Math.random(),
  network = ENetwork.bitcoin,
  timeout = 2000,
  txid = '',
} = {}) => {
  const method = 'getBlockTransaction';

  try {
    if (!clients.mainClient[network]) {
      const connectRes = await connectToRandomPeer(
        network,
        clients.peers[network],
      );
      if (connectRes.error) {
        return { ...connectRes, id, method, network };
      }
    }
    const { data, error } = await promiseTimeout(
      timeout,
      clients.mainClient[network].blockchainTransaction_get(txid, true),
    );
    return { id, method, network, data, error };
  } catch (e) {
    return { id, method, network, data: e, error: true };
  }
};

export default {
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
