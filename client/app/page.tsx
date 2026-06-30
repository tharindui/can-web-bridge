'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import SendFrame from '@/components/SendFrame';
import FrameLog, { Frame } from '@/components/FrameLog';

export default function Home() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [frames, setFrames] = useState<Frame[]>([]);

  useEffect(() => {
    const s = io('http://localhost:3001');
    setSocket(s);

    s.on('connect', () => setConnected(true));
    s.on('disconnect', () => setConnected(false));

    s.on('frame-received', (frame: Omit<Frame, 'type'>) => {
      setFrames((prev) => [{ ...frame, type: 'received' as const }, ...prev].slice(0, 100));
    });

    return () => { s.disconnect(); };
  }, []);

  function handleSent(id: string, data: string) {
    setFrames((prev) => [
      { id, data, timestamp: new Date().toISOString(), type: 'sent' as const },
      ...prev,
    ].slice(0, 100));
  }

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <span className={`text-sm px-3 py-1 rounded-full font-medium ${connected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
            {connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        <SendFrame socket={socket} onSent={handleSent} />
        <FrameLog frames={frames} />
      </div>
    </main>
  );
}
