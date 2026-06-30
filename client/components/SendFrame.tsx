'use client';

import { useState } from 'react';
import { Socket } from 'socket.io-client';

interface Props {
  socket: Socket | null;
  onSent: (id: string, data: string) => void;
}

function validateCanId(val: string) {
  return /^0x[0-9A-Fa-f]+$/.test(val.trim()) ? '' : 'Must be hex e.g. 0x123';
}

function validateData(val: string) {
  const bytes = val.trim().split(/\s+/);
  return bytes.every((b) => /^[0-9A-Fa-f]{1,2}$/.test(b))
    ? ''
    : 'Must be space-separated hex bytes e.g. 01 02 03';
}

export default function SendFrame({ socket, onSent }: Props) {
  const [canId, setCanId] = useState('0x123');
  const [data, setData] = useState('01 02 03');
  const [idError, setIdError] = useState('');
  const [dataError, setDataError] = useState('');

  function handleSend() {
    const ie = validateCanId(canId);
    const de = validateData(data);
    setIdError(ie);
    setDataError(de);
    if (ie || de || !socket) return;
    socket.emit('send-frame', { id: canId.trim(), data: data.trim() });
    onSent(canId.trim(), data.trim());
  }

  return (
    <div className="bg-white rounded-xl shadow p-6 space-y-4">
      <h2 className="text-lg font-semibold text-gray-700">Send CAN Frame</h2>
      <div className="flex gap-4">
        <div className="flex-1">
          <label htmlFor="can-id" className="block text-sm text-gray-500 mb-1">CAN ID</label>
          <input
            id="can-id"
            className={`w-full border rounded-lg px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 ${idError ? 'border-red-400 focus:ring-red-300' : 'focus:ring-blue-400'}`}
            value={canId}
            onChange={(e) => { setCanId(e.target.value); setIdError(''); }}
            placeholder="0x123"
          />
          {idError && <p className="text-xs text-red-500 mt-1">{idError}</p>}
        </div>
        <div className="flex-1">
          <label htmlFor="can-data" className="block text-sm text-gray-500 mb-1">Data bytes</label>
          <input
            id="can-data"
            className={`w-full border rounded-lg px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 ${dataError ? 'border-red-400 focus:ring-red-300' : 'focus:ring-blue-400'}`}
            value={data}
            onChange={(e) => { setData(e.target.value); setDataError(''); }}
            placeholder="01 02 03"
          />
          {dataError && <p className="text-xs text-red-500 mt-1">{dataError}</p>}
        </div>
      </div>
      <button
        onClick={handleSend}
        disabled={!socket}
        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
      >
        Send
      </button>
    </div>
  );
}
