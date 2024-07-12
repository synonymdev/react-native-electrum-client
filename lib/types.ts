export type Net = typeof import('net');
export type Tls = typeof import('tls');

export enum ENetwork {
  bitcoin = 'bitcoin',
  bitcoinTestnet = 'bitcoinTestnet',
  bitcoinRegtest = 'bitcoinRegtest',
}

export enum EProtocol {
  tcp = 'tcp',
  tls = 'tls',
  ssl = 'ssl',
}

export type Balance = {
  confirmed: number;
  unconfirmed: number;
};
