import { SocketConstructorOpts } from 'net';
import Client from './client';
import { TlsSocketWrapper } from './TlsSocketWrapper';
import { EProtocol } from './types';

const TIMEOUT = 5000;
const isNode = process?.release.name === 'node';

const getSocket = (
  self: Client,
  protocol: EProtocol,
  options?: SocketConstructorOpts,
) => {
  switch (protocol) {
    case EProtocol.tcp: {
      return new self.net.Socket(options);
    }
    case EProtocol.tls:
    case EProtocol.ssl: {
      if (!self.tls) {
        throw new Error('TLS package could not be loaded');
      }

      let tlsSocket;

      if (isNode) {
        tlsSocket = new TlsSocketWrapper({ tls: self.tls, verbose: false });
      } else {
        const socket = new self.net.Socket(options);
        tlsSocket = new self.tls.TLSSocket(socket, {
          rejectUnauthorized: false,
        });
      }

      return tlsSocket;
    }
  }
};

const initSocket = (
  self: Client,
  protocol: EProtocol,
  options?: SocketConstructorOpts,
) => {
  const socket = getSocket(self, protocol, options);
  socket.setTimeout(TIMEOUT);
  socket.setEncoding('utf8');
  socket.setKeepAlive(true, 0);
  socket.setNoDelay(true);

  socket.on('connect', () => {
    socket.setTimeout(0);
    self.onConnect();
  });

  socket.on('close', () => {
    self.onClose();
  });

  socket.on('data', (chunk) => {
    socket.setTimeout(0);
    self.onReceive(chunk);
  });

  socket.on('error', (e) => {
    self.onError(e);
  });

  return socket;
};

export default initSocket;
