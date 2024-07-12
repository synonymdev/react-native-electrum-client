import ElectrumClient from '../lib/electrum_client';
import { ENetwork, EProtocol } from './client';
import { objectKeys } from './objectKeys';

type TNetworkItem<T> = {
  [ENetwork.bitcoin]: T;
  [ENetwork.bitcoinTestnet]: T;
  [ENetwork.bitcoinRegtest]: T;
};

export type TPeer = { host: string; port: number; protocol: EProtocol };

export const getNetworkContent = <T>(data: T): TNetworkItem<T> => {
  const networks = objectKeys(ENetwork);
  const content = {} as TNetworkItem<T>;

  networks.forEach((network) => {
    content[network] = data;
  });

  return content;
};

const emptyPeer = { port: 50001, host: '', protocol: EProtocol.tcp };

class Clients {
  network: ENetwork;
  mainClient: TNetworkItem<ElectrumClient | undefined>;
  peer: TNetworkItem<TPeer>;
  peers: TNetworkItem<TPeer[]>;
  subscribedAddresses: TNetworkItem<string[]>;
  subscribedHeaders: TNetworkItem<boolean>;
  onAddressReceive: TNetworkItem<any>;

  constructor() {
    this.network = ENetwork.bitcoin;
    this.mainClient = getNetworkContent(undefined);
    this.peer = getNetworkContent(emptyPeer);
    this.peers = getNetworkContent([]);
    this.subscribedAddresses = getNetworkContent([]);
    this.subscribedHeaders = getNetworkContent(false);
    this.onAddressReceive = getNetworkContent(undefined);
  }

  // updateNetwork(network: ENetwork) {
  //   this.network = network;
  // }

  // updateMainClient(mainClient: any) {
  //   this.mainClient = mainClient;
  // }

  // updatePeer(peer: any) {
  //   this.peer = peer;
  // }
}

export default new Clients();
