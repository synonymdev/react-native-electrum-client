const electrum = require('../helpers/index');
const repl = require('repl');

const params = {
    'bitcoinMainnet': [{
        host: '35.187.18.233',
        ssl: 18484,
        tcp: 18483,
        protocol: 'tls'
    }],
    'bitcoinRegtest': [{
        host: '35.233.47.252',
        ssl: 18484,
        tcp: 18483,
        protocol: 'tcp'
    }]
}
const runExample = async () => {
    const network = 'bitcoinRegtest';
    const startRes = await electrum.start({
        network,
        customPeers: params[network], // Provide an array of custom peers (optional)
        net: require('net'),
        tls: require('tls'),
    });
    console.log('\nstartRes:', startRes);

    const subscribeRes = await electrum.subscribeAddress({
        network,
        scriptHash: '864c9e1340a909f75175f0e01f557b8baf5d1d0fe2157681805aa9d7a6883d5e',
        onReceive: async (data) => {
            console.log('onReceiveData:', data);
        }
    });
    console.log('\nsubscribeRes:', subscribeRes);

    const r = repl.start('> ');
    r.context.electrum = electrum;

    // const stopRes = await stop();
    // console.log('\nStop Res:', stopRes);
};

runExample().then();
