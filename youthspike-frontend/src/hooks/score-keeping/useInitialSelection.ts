import { useEffect } from 'react';
import { INetRelatives, IServerReceiverOnNetMixed } from '@/types';

export default function useInitialSelection(
  currNetNum: number | null,
  netByNum: Map<number, INetRelatives>,
  serverReceiverByNetId: Map<string, IServerReceiverOnNetMixed>,
  setActionPreview: React.Dispatch<React.SetStateAction<boolean>>,
) {
  useEffect(() => {
    if (!currNetNum) return;
    const net = netByNum.get(currNetNum);
    if (!net) return;
    const pre = serverReceiverByNetId.get(net._id);
    
    if (pre) {
      setActionPreview(true);
    }
  }, [currNetNum, netByNum, serverReceiverByNetId]);
}