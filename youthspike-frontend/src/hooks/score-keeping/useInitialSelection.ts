import { useEffect } from 'react';
import { IServerReceiverOnNetMixed } from '@/types';

export default function useInitialSelection(
  currNetNum: number | null,
  netByNum: Map<number, any>,
  serverReceiverByNetId: Map<string, IServerReceiverOnNetMixed>,
  setSelectedServer: (s: string | null) => void,
  setSelectedReceiver: (r: string | null) => void,
) {
  useEffect(() => {
    if (!currNetNum) return;
    const net = netByNum.get(currNetNum);
    if (!net) return;
    const pre = serverReceiverByNetId.get(net._id);
    if (pre) {
      setSelectedServer(typeof pre.server === 'string' ? pre.server : pre.server?._id ?? null);
      setSelectedReceiver(typeof pre.receiver === 'string' ? pre.receiver : pre.receiver?._id ?? null);
    }
  }, [currNetNum, netByNum, serverReceiverByNetId, setSelectedServer, setSelectedReceiver]);
}
