import { useEffect } from 'react';
import { IServerReceiverOnNet } from '@/types';

export default function useInitialSelection(
  currNetNum: number | null,
  netByNum: Map<number, any>,
  serverReceiverByNetId: Map<string, IServerReceiverOnNet>,
  setSelectedServer: (s: string | null) => void,
  setSelectedReceiver: (r: string | null) => void,
) {
  useEffect(() => {
    if (!currNetNum) return;
    const net = netByNum.get(currNetNum);
    if (!net) return;
    const pre = serverReceiverByNetId.get(net._id);
    if (pre) {
      setSelectedServer(pre.server);
      setSelectedReceiver(pre.receiver);
    }
  }, [currNetNum, netByNum, serverReceiverByNetId, setSelectedServer, setSelectedReceiver]);
}
