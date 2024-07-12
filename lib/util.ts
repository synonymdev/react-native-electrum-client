const makeRequest = (method: string, params: any[], id: number) => {
  return JSON.stringify({
    jsonrpc: "2.0",
    id,
    method,
    params,
  });
};

const createRecursiveParser = (max_depth: number, delimiter: string) => {
  const recursiveParser = (n, buffer, callback) => {
    if (buffer.length === 0) {
      return { code: 0, buffer: buffer };
    }
    if (n > max_depth) {
      return { code: 1, buffer: buffer };
    }
    const xs = buffer.split(delimiter);
    if (xs.length === 1) {
      return { code: 0, buffer: buffer };
    }
    callback(xs.shift(), n);
    return recursiveParser(n + 1, xs.join(delimiter), callback);
  };

  return recursiveParser;
};

const createPromiseResult = (resolve, reject) => {
  return (err, result) => {
    if (err) reject(err);
    else resolve(result);
  };
};

const createPromiseResultBatch = (resolve, reject, argz) => {
  return (err, result) => {
    if (Array.isArray(result) && result.length > 0 && result[0]?.id) {
      // this is a batch request response
      for (let r of result) {
        r["param"] = argz[r.id].param;
        r["data"] = argz[r.id].data;
      }
    }
    if (err) reject(err);
    else resolve(result);
  };
};

export class MessageParser {
  buffer: string;
  callback: any;
  recursiveParser: any;

  constructor(callback) {
    this.buffer = "";
    this.callback = callback;
    this.recursiveParser = createRecursiveParser(20, "\n");
  }

  run(chunk) {
    this.buffer += chunk;
    while (true) {
      const res = this.recursiveParser(0, this.buffer, this.callback);
      this.buffer = res.buffer;
      if (res.code === 0) {
        break;
      }
    }
  }
}

export default {
  MessageParser,
  makeRequest,
  createRecursiveParser,
  createPromiseResult,
  createPromiseResultBatch,
};
