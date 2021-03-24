'use strict'
const TlsSocketWrapper = require('./TlsSocketWrapper.js');
const TIMEOUT = 5000

const getSocket = (self, protocol, options) => {
    switch(protocol){
    case 'tcp':
        return new self.net.Socket();
    case 'tls':
    case 'ssl':
        if (!self.tls) throw new Error('tls package could not be loaded');
        return new TlsSocketWrapper({ tls: self.tls, verbose: false });
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
