// Abstract CAN-Bus interface.
// Swap the adapter import here to switch between serial (Proteus) and real hardware.
const adapter = require('./serialAdapter');

module.exports = {
  connect: adapter.connect,
  sendFrame: adapter.sendFrame,
  onFrame: adapter.onFrame,
};
