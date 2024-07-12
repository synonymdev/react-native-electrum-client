import { Socket } from 'net';
import { EventEmitter } from 'events';
import util, { MessageParser } from './util';
import initSocket from './init_socket';
import connectSocket from './connect_socket';
import { EProtocol, Net, Tls } from './types';

class Client {
  net: Net;
  tls: Tls;
  id: number;
  port: number;
  host: string;
  callback_message_queue;
  subscribe;
  conn: Socket;
  mp: MessageParser;
  status: 0 | 1;

  constructor(
    port: number,
    host: string,
    protocol = EProtocol.tcp,
    net: Net,
    tls: Tls,
  ) {
    this.net = net;
    this.tls = tls;
    this.id = 0;
    this.port = port;
    this.host = host;
    this.callback_message_queue = {};
    this.subscribe = new EventEmitter();
    this.conn = initSocket(this, protocol);
    this.mp = new util.MessageParser((body, n) => {
      this.onMessage(body, n);
    });
    this.status = 0;
  }

  async connect() {
    if (this.status) {
      return Promise.resolve({ error: false, data: '' });
    }
    const result = await connectSocket(this.conn, this.port, this.host);
    this.status = result.error ? 0 : 1;
    return Promise.resolve(result);
  }

  close() {
    if (!this.status) {
      return;
    }
    this.conn.end();
    this.conn.destroy();
    this.status = 0;
  }

  request<T>(method: string, params): Promise<T> {
    if (!this.status) {
      return Promise.reject(
        new Error('Connection to server lost, please retry'),
      );
    }
    return new Promise((resolve, reject) => {
      const id = ++this.id;
      const content = util.makeRequest(method, params, id);
      this.callback_message_queue[id] = util.createPromiseResult(
        resolve,
        reject,
      );
      this.conn.write(content + '\n');
    });
  }

  requestObjectBatch(method: string, params, secondParam) {
    return new Promise((resolve, reject) => {
      let arguments_far_calls = {};
      let contents: string[] = [];
      const { key, data } = params;
      if (Array.isArray(data)) {
        for (let item of data) {
          const id = ++this.id;
          let param = '';
          if (key in item) param = item[key];
          if (secondParam !== undefined) {
            contents.push(util.makeRequest(method, [param, secondParam], id));
          } else {
            contents.push(util.makeRequest(method, [param], id));
          }
          arguments_far_calls[id] = { param, data: item };
        }
      } else {
        for (let item of Object.keys(data)) {
          const id = ++this.id;
          let param = '';
          if (key in data[item]) param = data[item][key];
          if (secondParam !== undefined) {
            contents.push(util.makeRequest(method, [param, secondParam], id));
          } else {
            contents.push(util.makeRequest(method, [param], id));
          }
          arguments_far_calls[id] = { param, data: data[item] };
        }
      }
      const content = `[${contents.join(',')}]`;
      this.callback_message_queue[this.id] = util.createPromiseResultBatch(
        resolve,
        reject,
        arguments_far_calls,
      );
      // callback will exist only for max id
      this.conn.write(content + '\n');
    });
  }

  requestBatch(method: string, params, secondParam) {
    if (!this.status) {
      return Promise.reject(
        new Error('Connection to server lost, please retry'),
      );
    }
    if (typeof params === 'object' && 'key' in params && 'data' in params) {
      return this.requestObjectBatch(method, params, secondParam);
    }
    return new Promise((resolve, reject) => {
      let arguments_far_calls = {};
      let contents: string[] = [];
      for (let param of params) {
        const id = ++this.id;
        let data = {};
        if (secondParam !== undefined) {
          contents.push(util.makeRequest(method, [param, secondParam], id));
        } else {
          contents.push(util.makeRequest(method, [param], id));
        }
        arguments_far_calls[id] = { param, data };
      }
      const content = `[${contents.join(',')}]`;
      this.callback_message_queue[this.id] = util.createPromiseResultBatch(
        resolve,
        reject,
        arguments_far_calls,
      );
      // callback will exist only for max id
      this.conn.write(content + '\n');
    });
  }

  response(msg) {
    let callback;
    if (Array.isArray(msg)) {
      // this is a response from batch request
      for (let m of msg) {
        if (m?.id && m.id in this.callback_message_queue) {
          callback = this.callback_message_queue[m.id];
        }
      }
    } else if (msg?.id && msg.id in this.callback_message_queue) {
      callback = this.callback_message_queue[msg.id];
    }

    if (callback) {
      if (msg?.error) {
        callback(
          msg?.error?.message ??
            `Unable to resolve request: ${JSON.stringify(msg)}`,
        );
      } else {
        callback(null, msg?.result || msg);
      }
      if (msg.id in this.callback_message_queue) {
        delete this.callback_message_queue[msg.id];
      }
    } else if (msg?.error && msg?.error?.message === 'Batch limit exceeded') {
      // Return error for all pending requests
      const keys = Object.keys(this.callback_message_queue);
      for (const key of keys) {
        this.callback_message_queue[key](msg.error.message);
        delete this.callback_message_queue[key];
      }
    } else {
      console.log("Can't get callback in response in client.js"); // can't get callback
    }
  }

  onMessage(body, n) {
    try {
      const msg = JSON.parse(body);
      if (msg instanceof Array) {
        this.response(msg);
      } else {
        if (msg.id !== void 0) {
          this.response(msg);
        } else {
          this.subscribe.emit(msg.method, msg.params);
        }
      }
    } catch (error) {
      this.conn.end();
      this.conn.destroy();
      this.onClose();
    }
  }

  onConnect() {}

  onClose() {
    this.status = 0;
    Object.keys(this.callback_message_queue).forEach((key) => {
      this.callback_message_queue[key](new Error('close connect'));
      delete this.callback_message_queue[key];
    });
  }

  onReceive(chunk) {
    this.mp.run(chunk);
  }

  onError(e) {
    console.log('OnError:' + e);
  }
}

export default Client;
