import { describe, expect, it, beforeAll, afterAll } from "@jest/globals";
import net from "net";
import tls from "tls";

import constants from "./constants";
import clients from "../helpers/clients";
import helpers from "../helpers";
const { network, peer, address, addresses, scriptHashes, expected } = constants;

beforeAll(() => {}, 60000);

afterAll(() => {
  // Close the connection to allow Jest to exit successfully.
  helpers.stop();
});

describe("Electrum client", function () {
  it("Should connect to the provided testnet server", async () => {
    const response = await helpers.start({ net, tls, network });
    const expected = {
      // id: 0.29098913884072286,
      method: "connectToPeer",
      network: "bitcoinTestnet",
      // TODO: use TLS after fix for nodejs
      data: { port: peer.tcp, host: peer.host },
      customPeers: [],
      error: false,
    };
    expect(response).toHaveProperty("id");
    delete response.id;
    expect(response).toEqual(expected);
    expect(response.data).toEqual({
      host: clients.peer[network].host,
      port: clients.peer[network].port,
    });
  });

  it("Should successfully ping the server", async () => {
    const expected = {
      // id: 0.1959018255832432,
      method: "pingServer",
      network: "bitcoinTestnet",
      data: { jsonrpc: "2.0", result: null, id: 3 },
      error: false,
    };
    const response = await helpers.pingServer();
    expect(response).toHaveProperty("id");
    delete response.id;
    expect(response).toEqual(expected);
  });

  it("Should disconnect from specified network peer.", async () => {
    const response = await helpers.stop({ network });
    const expected = {
      // id: 0.1959018255832432,
      method: "disconnectFromPeer",
      network: "bitcoinTestnet",
      data: "Disconnected...",
      error: false,
    };
    expect(response).toHaveProperty("id");
    delete response.id;
    expect(response).toEqual(expected);
  });

  it("Should successfully connect to a specified peer", async () => {
    const response = await helpers.start({
      net,
      tls,
      network,
      customPeers: [peer],
    });
    const expected = {
      // id: 0.1959018255832432,
      method: "connectToPeer",
      network: "bitcoinTestnet",
      // TODO: use TLS after fix for nodejs
      data: { port: peer.tcp, host: peer.host },
      customPeers: [peer],
      error: false,
    };
    expect(response).toHaveProperty("id");
    delete response.id;
    expect(response).toEqual(expected);
    expect(response.data).toEqual({
      host: clients.peer[network].host,
      port: clients.peer[network].port,
    });
  });

  it("Should return the balance of a specified address scriptHash", async () => {
    const scriptHash = addresses[network][0].scriptHash;
    const response = await helpers.getAddressScriptHashBalance({
      network,
      scriptHash,
    });
    expect(response).toHaveProperty("id");
    delete response.id;
    expect(response).toEqual(expected.addressScriptHashBalance);
  });

  // TODO: brittle test
  it("Should return the balance of multiple specified address scriptHashes", async () => {
    const response = await helpers.getAddressScriptHashBalances({
      network,
      scriptHashes,
    });
    expect(response).toHaveProperty("id");
    delete response.id;
    expect(response.data).toBeInstanceOf(Array);
    // expect(response).toEqual(expected.addressScriptHashBalances);
  });

  it("Should return an array of peers from the connected server", async () => {
    const response = await helpers.getPeers({ network });
    expect(response).toHaveProperty("id");
    expect(response.method).toBe("getPeers");
    expect(response.network).toBe("bitcoinTestnet");
    expect(response.error).toBe(false);
    expect(response.data).toBeInstanceOf(Array);
  });

  // This test only ensures that subscribeHeader doesn't fail.
  // It can't determine if onReceive is successfully fired when a new block is found.
  it("Should successfully subscribe to headers", async () => {
    const response = await helpers.subscribeHeader({ network });
    expect(response.id).toBe("subscribeHeader");
    expect(response.method).toBe("subscribeHeader");
    expect(response.error).toBe(false);
    expect(typeof response.data.height).toBe("number");
    expect(typeof response.data.hex).toBe("string");
  });

  // This test only ensures that subscribeAddress doesn't fail.
  // It can't determine if onReceive is successfully fired when the specified address receives funds.
  it("Should successfully subscribe to address.", async () => {
    const response = await helpers.subscribeAddress({
      scriptHash: address.scriptHash,
      network,
    });
    expect(typeof response.data).toBe("string");
  });

  it("Should return a fee estimate based on blocks willing to wait", async () => {
    const response = await helpers.getFeeEstimate({
      blocksWillingToWait: 30,
      network,
    });
    expect(typeof response.id).toBe("number");
    expect(response.method).toBe("getFeeEstimate");
    expect(response.network).toBe("bitcoinTestnet");
    expect(response.error).toBe(false);
    expect(typeof response.data).toBe("number");
  });
});
