const http = require('http');
const net = require('net');

const delay = (t, v) => {
    return new Promise((resolve) => {
        setTimeout(resolve.bind(null, v), t);
    });
};

const log = (message) => {
    console.log(`${(new Date()).toISOString()} - ${message}`);
};

let openedTime, closedTime;

const address = '127.0.0.1';
const port = 8000;

const pingAfterDelay = async (socket, delayInMS) => {
    await(delay(delayInMS));
    socket.write('GET / HTTP/1.1\r\n');
    socket.write(`Host: ${address}\r\n\r\n`);
    log('HTTP Request was Sent');
}

const runTestWithIntialDelay = async (delayInMS) => {
    log(`Beginning Socket Timeout Test (${delayInMS / 1000}s delay)`);
    return new Promise(async (resolve, reject) => {
        try {
            const socket = new net.Socket();
            socket.setKeepAlive(false);
            socket.setTimeout(delayInMS * 2);

            socket.connect(port, address, () => {
                pingAfterDelay(socket, delayInMS);
            });

            socket.on('timeout', () => {
                log('Closing socket via the client');
                socket.end();
                resolve();
            });

            socket.on('data', (data) => {
                console.log(`\n\n${data}\n\n`);
                log('An HTTP Response was Received');
            });

            socket.on('error', (e) => {
                log('An error was received' + e);
                process.exit(1);
            });

            socket.on('close', () => {
                log('Server Closed Connection');
                resolve();
            });
        } catch (err) {
            log('Unexpected Exception');
            log(err);
            reject(err);
        }
    })
};

const execute = async () => {
    await runTestWithIntialDelay(39 * 1000);
    await runTestWithIntialDelay(41 * 1000);
    process.exit(0);
}

execute();
