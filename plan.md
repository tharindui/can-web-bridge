need simple application comunicate with proteus with micro controller throgh web app need to send inputs and see the changes there real time 

## Tech Stack
- Next.js (frontend UI)
- Node.js + Express (backend server)
- socket.io (real-time browser ↔ server communication)
- serialport npm (server ↔ Proteus virtual COM port, current)
- com0com (virtual serial port pair on Windows — links Node.js to Proteus)
- node-can (future swap for real CAN-Bus hardware adapter)

## Protocol: CAN-Bus
Client uses CAN-Bus. Simulated over serial now, real hardware later.

Frame format (text, easy for Proteus firmware to parse):
  PC → MCU:  SEND:<ID>:<DATA>\n   e.g. SEND:0x123:01 02 03\n
  MCU → PC:  RECV:<ID>:<DATA>\n   e.g. RECV:0x456:FF 00\n

## Flow
Browser (Next.js)
    ↕ WebSocket (socket.io)
Node.js server
    ↕ canBus.js (abstract interface)
    ↕ serialAdapter.js  ← active now
    ↕ [hardwareAdapter.js]  ← future real CAN-USB swap
Virtual COM port (com0com)
    ↕
Proteus (simulated microcontroller)

## Structure
test-project/
├── client/                       (Next.js)
│   ├── app/page.tsx               (main UI)
│   └── components/
│       ├── SendFrame.tsx          (CAN ID + data input + send button)
│       └── FrameLog.tsx           (real-time received frames log)
└── server/                       (Node.js)
    ├── index.js                   (Express + socket.io)
    └── can/
        ├── canBus.js              (interface: sendFrame, onFrame)
        └── serialAdapter.js       (serialport implementation)

## Config (server/.env)
COM_PORT=COM3
BAUD_RATE=9600
PORT=3001