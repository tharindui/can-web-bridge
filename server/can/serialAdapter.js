const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

const COM_PORT = process.env.COM_PORT || 'COM3';
const BAUD_RATE = parseInt(process.env.BAUD_RATE || '9600', 10);

let port;
let frameCallbacks = [];

function connect() {
  port = new SerialPort({ path: COM_PORT, baudRate: BAUD_RATE });
  const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

  port.on('open', () => console.log(`Serial open: ${COM_PORT} @ ${BAUD_RATE}`));
  port.on('error', (err) => console.error('Serial error:', err.message));

  parser.on('data', (line) => {
    // Expected format from MCU: RECV:<ID>:<DATA>
    const match = line.trim().match(/^RECV:(0x[0-9A-Fa-f]+):(.*)$/);
    if (!match) return;
    const frame = { id: match[1], data: match[2].trim() };
    frameCallbacks.forEach((cb) => cb(frame));
  });
}


function sendFrame(id, data) {
  if (!port || !port.isOpen) {
    console.warn('Serial port not open, cannot send frame');
    return;
  }
  port.write(`SEND:${id}:${data}\n`);
}

function onFrame(cb) {
  frameCallbacks.push(cb);
}

module.exports = { connect, sendFrame, onFrame };
