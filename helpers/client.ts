import ElectrumClient from '../lib/electrum_client';
import { objectKeys } from './objectKeys';

export enum ENetwork {
  bitcoin = 'bitcoin',
  bitcoinTestnet = 'bitcoinTestnet',
  bitcoinRegtest = 'bitcoinRegtest',
}

type TNetworkItem<T> = {
  [ENetwork.bitcoin]: T;
  [ENetwork.bitcoinTestnet]: T;
  [ENetwork.bitcoinRegtest]: T;
};

export enum EProtocol {
  tcp = 'tcp',
  tls = 'tls',
  ssl = 'ssl',
}

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

type TClient = {
  network: ENetwork;
  mainClient: TNetworkItem<ElectrumClient | undefined>;
  peer: TNetworkItem<TPeer>;
  peers: TNetworkItem<TPeer[]>;
  subscribedAddresses: TNetworkItem<string[]>;
  subscribedHeaders: TNetworkItem<boolean>;
  onAddressReceive: TNetworkItem<any>;
};

const client: TClient = {
  network: ENetwork.bitcoin,
  mainClient: getNetworkContent(undefined),
  peer: getNetworkContent(emptyPeer),
  peers: getNetworkContent([]),
  subscribedAddresses: getNetworkContent([]),
  subscribedHeaders: getNetworkContent(false),
  onAddressReceive: getNetworkContent(undefined),
};

export default client;
