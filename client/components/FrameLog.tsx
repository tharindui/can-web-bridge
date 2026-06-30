'use client';

export interface Frame {
  id: string;
  data: string;
  timestamp: string;
  type: 'sent' | 'received';
}

interface Props {
  frames: Frame[];
}

export default function FrameLog({ frames }: Props) {
  return (
    <div className="bg-white rounded-xl shadow p-6 space-y-3">
      <h2 className="text-lg font-semibold text-gray-700">Logs</h2>
      {frames.length === 0 ? (
        <p className="text-sm text-gray-400">No data</p>
      ) : (
        <div className="overflow-auto max-h-80">
          <table className="w-full text-sm font-mono">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-2 pr-3">Time</th>
                <th className="pb-2 pr-3">Dir</th>
                <th className="pb-2 pr-4">CAN ID</th>
                <th className="pb-2">Data</th>
              </tr>
            </thead>
            <tbody>
              {frames.map((f, i) => (
                <tr key={i} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="py-1 pr-3 text-gray-400 text-xs">
                    {new Date(f.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-1 pr-3">
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${f.type === 'sent' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                      {f.type === 'sent' ? 'TX' : 'RX'}
                    </span>
                  </td>
                  <td className="py-1 pr-4 text-gray-700">{f.id}</td>
                  <td className="py-1 text-gray-800">{f.data}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
