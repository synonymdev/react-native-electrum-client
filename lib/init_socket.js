'use strict'

const TlsSocketWrapper = require('./TlsSocketWrapper.js');

const TIMEOUT = 5000
const isNode = process?.release?.name === 'node'

const getSocket = (self, protocol, options) => {
    switch(protocol){
    case 'tcp':
        return new self.net.Socket();
    case 'tls':
    case 'ssl':
        if (!self.tls) throw new Error('TLS package could not be loaded');
        let tlsSocket;

        if (isNode) {
          tlsSocket = new TlsSocketWrapper({ tls: self.tls, verbose: false });
        } else {
          const socket = new self.net.Socket();
          tlsSocket = new self.tls.TLSSocket(socket, { rejectUnauthorized: false });
        }

        return tlsSocket;
    }
    throw new Error('unknown protocol')
}

const initSocket = (self, protocol, options) => {
    const conn = getSocket(self, protocol, options);
    conn.setTimeout(TIMEOUT)
    conn.setEncoding('utf8')
    conn.setKeepAlive(true, 0)
    conn.setNoDelay(true)
    conn.on('connect', () => {
        conn.setTimeout(0)
        self.onConnect()
    })
    conn.on('close', (e) => {
        self.onClose(e)
    })
    conn.on('data', (chunk) => {
        conn.setTimeout(0)
        self.onRecv(chunk)
    })
    conn.on('error', (e) => {
        self.onError(e)
    })
    return conn
}

module.exports = initSocket
