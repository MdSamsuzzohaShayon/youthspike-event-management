import { useEffect } from 'react';
import { IServerReceiverOnNetMixed } from '@/types';

export default function useInitialSelection(
  currNetNum: number | null,
  netByNum: Map<number, any>,
  serverReceiverByNetId: Map<string, IServerReceiverOnNetMixed>,
  setSelectedServer: React.Dispatch<React.SetStateAction<string | null>>,
  setSelectedReceiver: React.Dispatch<React.SetStateAction<string | null>>,
  setActionPreview: React.Dispatch<React.SetStateAction<boolean>>,
) {
  useEffect(() => {
    if (!currNetNum) return;
    const net = netByNum.get(currNetNum);
    if (!net) return;
    const pre = serverReceiverByNetId.get(net._id);
    
    if (pre) {
      const serverId = typeof pre.server === 'string' ? pre.server : pre.server?._id ?? null;
      setSelectedServer(serverId);
      const receiverId = typeof pre.receiver === 'string' ? pre.receiver : pre.receiver?._id ?? null
      setSelectedReceiver(receiverId);
      setActionPreview(true);
    }
  }, [currNetNum, netByNum, serverReceiverByNetId, setSelectedServer, setSelectedReceiver]);
}
