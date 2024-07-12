import { Socket } from 'net';

type Result<T> = {
  data: T | Error;
  error: boolean;
};

const connectSocket = (
  conn: Socket,
  port: number,
  host: string,
): Promise<Result<{ port: number; host: string }>> => {
  return new Promise((resolve) => {
    const errorHandler = (e: Error) => resolve({ data: e, error: true });

    conn.connect({ port, host }, () => {
      conn.removeListener('error', errorHandler);
      resolve({ data: { port, host }, error: false });
    });

    conn.on('error', errorHandler);
  });
};

export default connectSocket;
