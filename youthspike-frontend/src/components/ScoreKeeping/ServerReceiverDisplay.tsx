import React, { useCallback, useMemo, useState } from "react";
import Image from "next/image";
import {
  EPlayStrategy,
  EServerPositionPair,
  ESRRole,
  IOption,
  IPlayer,
  IServerReceiverOnNetMixed,
  ITeam,
} from "@/types";
import SRPlayerCard from "./SRPlayerCard";

interface IPlayerRole {
  player: IPlayer | null;
  role: ESRRole;
}

const playStrategies: IOption[] = [
  { id: 1, value: EPlayStrategy.RALLY_SCORING, text: 'Rally Scoring' },
  { id: 2, value: EPlayStrategy.EQUAL_SERVING, text: 'Equal Serving' },
];

interface IServerReceiverDisplayProps {
  currServerReceiver: IServerReceiverOnNetMixed | null;
  teamA: ITeam | null;
  teamB: ITeam | null;
  playerMap: Map<string, IPlayer>;
  playStrategy: EPlayStrategy;
  onStrategyChange: (e: React.SyntheticEvent) => void;
  handleAddReceiver?: (e: React.SyntheticEvent) => void;
  handleAddServer?: (e: React.SyntheticEvent) => void;
  matchId: string;
}

const ServerReceiverDisplay: React.FC<IServerReceiverDisplayProps> = ({
  currServerReceiver,
  teamA,
  teamB,
  playerMap,
  playStrategy,
  onStrategyChange,
  handleAddServer,
  handleAddReceiver,
  matchId
}) => {
  const [isStrategyModalOpen, setIsStrategyModalOpen] = useState(false);

  // Helper to safely call the parent's onStrategyChange with a mock event
  const handleStrategySelect = (value: string) => {
    const mockEvent = {
      preventDefault: () => {},
      target: { value },
    } as unknown as React.SyntheticEvent;
    onStrategyChange(mockEvent);
    setIsStrategyModalOpen(false);
  };

  const currentStrategyText = playStrategies.find(p => p.value === playStrategy)?.text || "Select Strategy";

  // Memoization
  const positions = useMemo(() => {
    const posMap = new Map<EServerPositionPair, IPlayerRole>();
    if (!currServerReceiver) return posMap;

    if (currServerReceiver?.serverPositionPair === EServerPositionPair.PAIR_A_TOP) {
      if (currServerReceiver?.server) {
        posMap.set(EServerPositionPair.PAIR_A_TOP, { player: playerMap.get(String(currServerReceiver.server)) || null, role: ESRRole.SERVER });
      }
      if (currServerReceiver?.servingPartner) {
        posMap.set(EServerPositionPair.PAIR_A_LEFT, { player: playerMap.get(String(currServerReceiver.servingPartner)) || null, role: ESRRole.SWING });
      }
      if (currServerReceiver?.receiver) {
        posMap.set(EServerPositionPair.PAIR_B_BOTTOM, { player: playerMap.get(String(currServerReceiver.receiver)) || null, role: ESRRole.RECEIVER });
      }
      if (currServerReceiver?.receivingPartner) {
        posMap.set(EServerPositionPair.PAIR_B_RIGHT, { player: playerMap.get(String(currServerReceiver.receivingPartner)) || null, role: ESRRole.SETTER });
      }
    } else if (currServerReceiver?.serverPositionPair === EServerPositionPair.PAIR_A_LEFT) {
      if (currServerReceiver?.server) {
        posMap.set(EServerPositionPair.PAIR_A_LEFT, { player: playerMap.get(String(currServerReceiver.server)) || null, role: ESRRole.SERVER });
      }
      if (currServerReceiver?.servingPartner) {
        posMap.set(EServerPositionPair.PAIR_A_TOP, { player: playerMap.get(String(currServerReceiver.servingPartner)) || null, role: ESRRole.SWING });
      }
      if (currServerReceiver?.receiver) {
        posMap.set(EServerPositionPair.PAIR_B_RIGHT, { player: playerMap.get(String(currServerReceiver.receiver)) || null, role: ESRRole.RECEIVER });
      }
      if (currServerReceiver?.receivingPartner) {
        posMap.set(EServerPositionPair.PAIR_B_BOTTOM, { player: playerMap.get(String(currServerReceiver.receivingPartner)) || null, role: ESRRole.SETTER });
      }
    } else if (currServerReceiver?.serverPositionPair === EServerPositionPair.PAIR_B_BOTTOM) {
      if (currServerReceiver?.server) {
        posMap.set(EServerPositionPair.PAIR_B_BOTTOM, { player: playerMap.get(String(currServerReceiver.server)) || null, role: ESRRole.SERVER });
      }
      if (currServerReceiver?.servingPartner) {
        posMap.set(EServerPositionPair.PAIR_B_RIGHT, { player: playerMap.get(String(currServerReceiver.servingPartner)) || null, role: ESRRole.SWING });
      }
      if (currServerReceiver?.receiver) {
        posMap.set(EServerPositionPair.PAIR_A_TOP, { player: playerMap.get(String(currServerReceiver.receiver)) || null, role: ESRRole.RECEIVER });
      }
      if (currServerReceiver?.receivingPartner) {
        posMap.set(EServerPositionPair.PAIR_A_LEFT, { player: playerMap.get(String(currServerReceiver.receivingPartner)) || null, role: ESRRole.SETTER });
      }
    } else if (currServerReceiver?.serverPositionPair === EServerPositionPair.PAIR_B_RIGHT) {
      if (currServerReceiver?.server) {
        posMap.set(EServerPositionPair.PAIR_B_RIGHT, { player: playerMap.get(String(currServerReceiver.server)) || null, role: ESRRole.SERVER });
      }
      if (currServerReceiver?.servingPartner) {
        posMap.set(EServerPositionPair.PAIR_B_BOTTOM, { player: playerMap.get(String(currServerReceiver.servingPartner)) || null, role: ESRRole.SWING });
      }
      if (currServerReceiver?.receiver) {
        posMap.set(EServerPositionPair.PAIR_A_LEFT, { player: playerMap.get(String(currServerReceiver.receiver)) || null, role: ESRRole.RECEIVER });
      }
      if (currServerReceiver?.receivingPartner) {
        posMap.set(EServerPositionPair.PAIR_A_TOP, { player: playerMap.get(String(currServerReceiver.receivingPartner)) || null, role: ESRRole.SETTER });
      }
    }

    return posMap;
  }, [currServerReceiver]);

  const renderPlayerCard = useCallback(
    (positionPairE: EServerPositionPair) => {
      const playerPosition = positions.get(positionPairE);
      let role = null;
      if (positionPairE === EServerPositionPair.PAIR_A_LEFT) {
        role = ESRRole.SERVER;
      } else if (positionPairE === EServerPositionPair.PAIR_B_RIGHT) {
        role = ESRRole.RECEIVER;
      }

      const handlePlayerSelection = (e: React.SyntheticEvent) => {
        if (role === ESRRole.SERVER) {
          if (handleAddServer) handleAddServer(e);
        } else if (role === ESRRole.RECEIVER) {
          if (handleAddReceiver) handleAddReceiver(e);
        }
      };
      
      if (!playerPosition) {
        return (
          <SRPlayerCard
            key={positionPairE}
            player={null}
            role={role}
            selected={null}
            teamA={teamA}
            teamB={teamB}
            handlePlayerSelection={handlePlayerSelection}
            positionPairE={positionPairE}
            matchId={matchId}
            netId={String(currServerReceiver?.net) || null}
          />
        );
      }
      return (
        <SRPlayerCard
          key={positionPairE}
          player={playerPosition.player}
          role={playerPosition.role}
          teamA={teamA}
          teamB={teamB}
          selected={playerPosition.player?._id || null}
          handlePlayerSelection={handlePlayerSelection}
          positionPairE={positionPairE}
          matchId={matchId}
          netId={String(currServerReceiver?.net) || null}
        />
      );
    },
    [positions, currServerReceiver, handleAddServer, handleAddReceiver, matchId]
  );

  return (
    <div className="display-server-receiver w-full flex justify-center items-center flex-col">
      <h3 className="text-xl font-semibold uppercase text-center mb-6 text-yellow-logo mt-6">
        Selected Server/Receiver
      </h3>
      
      {/* Custom Play Strategy Trigger Button */}
      <div className="w-full mb-6 px-4 sm:px-0">
        <button
          onClick={() => setIsStrategyModalOpen(true)}
          className="group relative w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl border border-gray-700 bg-gradient-to-br from-gray-900 to-black hover:border-yellow-400 transition-all duration-300 shadow-md hover:shadow-yellow-500/10 cursor-pointer overflow-hidden"
        >
          {/* Subtle glow effect on hover */}
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/0 via-yellow-400/5 to-yellow-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          
          <div className="flex flex-col items-start relative z-10">
            <span className="text-[10px] sm:text-xs uppercase tracking-[0.15em] text-gray-400 font-semibold mb-1">
              Play Strategy
            </span>
            <span className="text-lg sm:text-xl font-bold text-white tracking-wide">
              {currentStrategyText}
            </span>
          </div>
          
          <div className="flex items-center justify-center gap-2 relative z-10 mt-2 sm:mt-0">
            <span className="text-sm text-yellow-400 font-medium uppercase tracking-wider">
              Change
            </span>
            <div className="flex items-center justify-center w-8 h-8 rounded-full border border-yellow-400/30 bg-yellow-400/10 text-yellow-400 group-hover:bg-yellow-400 group-hover:text-black transition-colors duration-300">
              <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </button>
      </div>

      <div className="w-full flex justify-center items-center gap-x-2 md:gap-x-6">
        {renderPlayerCard(EServerPositionPair.PAIR_A_LEFT)}

        <div className="w-1/3 flex justify-center items-center">
          <div className="w-full flex flex-col items-center gap-6 p-6">
            {renderPlayerCard(EServerPositionPair.PAIR_A_TOP)}

            <div className="flex justify-center items-center py-2">
              <Image
                alt="Net"
                src="/imgs/spikeball-net.png"
                width={80}
                height={80}
              />
            </div>

            {renderPlayerCard(EServerPositionPair.PAIR_B_BOTTOM)}
          </div>
        </div>
        {renderPlayerCard(EServerPositionPair.PAIR_B_RIGHT)}
      </div>

      {/* Strategy Selection Modal */}
      {isStrategyModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setIsStrategyModalOpen(false)}
        >
          <div 
            className="w-full max-w-md bg-gradient-to-br from-gray-900 to-black border-2 border-yellow-400 rounded-2xl shadow-2xl shadow-yellow-500/20 p-6 transform transition-all duration-300 scale-95 opacity-0 animate-modal-pop"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: "modalPop 0.3s forwards ease-out" }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-700/50">
              <div>
                <h3 className="text-xl font-bold text-white uppercase tracking-wide">
                  Play Strategy
                </h3>
                <p className="text-gray-400 text-sm mt-1">Select your scoring rule</p>
              </div>
              <button
                onClick={() => setIsStrategyModalOpen(false)}
                className="flex items-center justify-center w-9 h-9 rounded-full text-gray-400 hover:text-white hover:bg-gray-800 transition-colors duration-200"
                aria-label="Close modal"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Options List */}
            <div className="space-y-3">
              {playStrategies.map((strategy) => {
                const isSelected = strategy.value === playStrategy;
                return (
                  <button
                    key={strategy.id}
                    onClick={() => handleStrategySelect(strategy.value)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-200 cursor-pointer group ${
                      isSelected
                        ? "border-yellow-400 bg-yellow-400/10 shadow-md shadow-yellow-500/10"
                        : "border-gray-700 bg-black/30 hover:border-gray-500 hover:bg-gray-800/50"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors duration-200 ${
                        isSelected 
                          ? "border-yellow-400 text-yellow-400 bg-yellow-400/10" 
                          : "border-gray-600 text-gray-500 group-hover:border-gray-400 group-hover:text-gray-300"
                      }`}>
                        {isSelected ? (
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <div className="w-2.5 h-2.5 rounded-full bg-current"></div>
                        )}
                      </div>
                      <div className="flex flex-col items-start">
                        <span className={`text-base font-bold tracking-wide ${isSelected ? "text-white" : "text-gray-300 group-hover:text-white"}`}>
                          {strategy.text}
                        </span>
                      </div>
                    </div>
                    
                    {isSelected && (
                      <span className="text-[10px] font-bold uppercase tracking-widest text-yellow-400 bg-yellow-400/10 px-2.5 py-1 rounded-full border border-yellow-400/30">
                        Active
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Inline style for keyframe animation */}
      <style jsx>{`
        @keyframes modalPop {
          0% {
            transform: scale(0.95);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default ServerReceiverDisplay;