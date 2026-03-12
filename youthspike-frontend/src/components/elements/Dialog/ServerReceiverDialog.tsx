import React, { useMemo, useRef, useState } from "react";
import {
  EMessage,
  ESRRole,
  IChangeServerReceiverAction,
  INetRelatives,
  IPlayer,
  IServerReceiverOnNetMixed,
  ITeam,
} from "@/types";
import TextImg from "../TextImg";
import { CldImage } from "next-cloudinary";
import { useAppDispatch } from "@/redux/hooks";
import { setMessage } from "@/redux/slices/elementSlice";
import EmitEvents from "@/utils/socket/EmitEvents";
import { useSocket } from "@/lib/SocketProvider";

interface ServerReceiverDialogProps {
  currServerReceiver: IServerReceiverOnNetMixed | null;
  playerMap: Map<string, IPlayer>;
  teamA: ITeam | null;
  teamB: ITeam | null;
  net: INetRelatives | null;
  srChangerEl: React.RefObject<HTMLDialogElement | null>;
  eventId: string;
}

const ServerReceiverDialog: React.FC<ServerReceiverDialogProps> = ({
  currServerReceiver,
  playerMap,
  teamA,
  teamB,
  net,
  srChangerEl,
  eventId
}) => {
  const dispatch = useAppDispatch();
  const socket = useSocket();

  const formRef = useRef<HTMLFormElement | null>(null);
  const [selectedServer, setSelectedServer] = useState<string>("");
  const [selectedReceiver, setSelectedReceiver] = useState<string>("");

  // Derive current serving and receiving teams and players
  const serverReceiverState = useMemo(() => {
    if (!currServerReceiver || !net) {
      return {
        server: null,
        servingPartner: null,
        receiver: null,
        receivingPartner: null,
        servingTeam: null,
        receivingTeam: null,
      };
    }

    const server = playerMap.get(String(currServerReceiver.server)) || null;
    const servingPartner =
      playerMap.get(String(currServerReceiver.servingPartner)) || null;
    const receiver = playerMap.get(String(currServerReceiver.receiver)) || null;
    const receivingPartner =
      playerMap.get(String(currServerReceiver.receivingPartner)) || null;

    const isTeamAServing =
      net.teamAPlayerA === currServerReceiver.server ||
      net.teamAPlayerB === currServerReceiver.server;

    const servingTeam = isTeamAServing ? teamA : teamB;
    const receivingTeam = isTeamAServing ? teamB : teamA;

    return {
      server,
      servingPartner,
      receiver,
      receivingPartner,
      servingTeam,
      receivingTeam,
    };
  }, [currServerReceiver, playerMap, net, teamA, teamB]);

  const {
    server,
    servingPartner,
    receiver,
    receivingPartner,
    servingTeam,
    receivingTeam,
  } = serverReceiverState;

  // Prepare team player lists
  const { teamAPlayerList, teamBPlayerList } = useMemo(() => {
    const teamAPlayerList: (IPlayer | null)[] = [];
    const teamBPlayerList: (IPlayer | null)[] = [];

    if (net && currServerReceiver) {
      const isTeamAServing =
        currServerReceiver.server === net.teamAPlayerA ||
        currServerReceiver.server === net.teamAPlayerB;

      if (isTeamAServing) {
        teamAPlayerList.push(server, servingPartner);
        teamBPlayerList.push(receiver, receivingPartner);
      } else {
        teamAPlayerList.push(receiver, receivingPartner);
        teamBPlayerList.push(server, servingPartner);
      }
    }

    return { teamAPlayerList, teamBPlayerList };
  }, [
    net,
    currServerReceiver,
    server,
    servingPartner,
    receiver,
    receivingPartner,
  ]);

  // Helper to filter players based on opposing team rule
  const getSelectablePlayers = (
    players: (IPlayer | null)[],
    opposingPlayers: (IPlayer | null)[],
    selectedOpponentId: string
  ) => {
    return [...players, ...opposingPlayers].filter((p) => {
      if (!p) return false;
      if (!selectedOpponentId) return true;

      const isOpponentInTeamA = teamAPlayerList.some(
        (r) => r?._id === selectedOpponentId
      );
      const isOpponentInTeamB = teamBPlayerList.some(
        (r) => r?._id === selectedOpponentId
      );

      if (isOpponentInTeamA)
        return teamBPlayerList.some((tp) => tp?._id === p._id);
      if (isOpponentInTeamB)
        return teamAPlayerList.some((tp) => tp?._id === p._id);

      return true;
    });
  };

  const handleSubmit = () => {
    if (!selectedServer || !selectedReceiver) {
      dispatch(setMessage({
        name: "InvalidData",
        message: "Please select both a Server and a Receiver!",
        type: EMessage.ERROR,
      }));
      return;
    }
  
    const csr = currServerReceiver;
  
    const actionBody: IChangeServerReceiverAction = {
      match: String(csr?.match ?? ""),
      net: String(net?._id ?? ""),
      room: String(csr?.room ?? ""),
      event: eventId,
      server: "",
      servingPartner: "",
      receiver: "",
      receivingPartner: "",
    };
  
    // --- Mapping for server selection ---
    const serverMap: Record<string, () => void> = {};
  
    if (csr?.server) {
      serverMap[String(csr.server)] = () => {
        actionBody.server = String(csr.server) ?? "";
        actionBody.servingPartner = String(csr.servingPartner) ?? "";
      };
    }
  
    if (csr?.servingPartner) {
      serverMap[String(csr.servingPartner)] = () => {
        actionBody.server = String(csr.servingPartner) ?? "";
        actionBody.servingPartner = String(csr.server) ?? "";
      };
    }
  
    if (csr?.receiver) {
      serverMap[String(csr.receiver)] = () => {
        actionBody.server = String(csr.receiver) ?? "";
        actionBody.servingPartner = String(csr.receivingPartner) ?? "";
      };
    }
  
    if (csr?.receivingPartner) {
      serverMap[String(csr.receivingPartner)] = () => {
        actionBody.server = String(String(csr.receivingPartner)) ?? "";
        actionBody.servingPartner = String(String(csr.receiver)) ?? "";
      };
    }
  
    if (serverMap[selectedServer]) {
      serverMap[selectedServer]();
    }
  
    // --- Mapping for receiver selection ---
    const receiverMap: Record<string, () => void> = {};
  
    if (csr?.receiver) {
      receiverMap[String(csr.receiver)] = () => {
        actionBody.receiver = String(csr.receiver) ?? "";
        actionBody.receivingPartner = String(csr.receivingPartner) ?? "";
      };
    }
  
    if (csr?.receivingPartner) {
      receiverMap[String(csr.receivingPartner)] = () => {
        actionBody.receiver = String(csr.receivingPartner) ?? "";
        actionBody.receivingPartner = String(csr.receiver) ?? "";
      };
    }
  
    if (csr?.server) {
      receiverMap[String(csr.server)] = () => {
        actionBody.receiver = String(csr.server) ?? "";
        actionBody.receivingPartner = String(csr.servingPartner) ?? "";
      };
    }
  
    if (csr?.servingPartner) {
      receiverMap[String(csr.servingPartner)] = () => {
        actionBody.receiver = String(csr.servingPartner) ?? "";
        actionBody.receivingPartner = String(csr.server) ?? "";
      };
    }
  
    if (receiverMap[selectedReceiver]) {
      receiverMap[selectedReceiver]();
    }
  
    // --- Validate all fields ---
    const isValid = Object.values(actionBody).every(
      (v) => typeof v === "string" && v.trim() !== ""
    );
  
    if (!isValid) {
      dispatch(setMessage({
        name: "InvalidData",
        message: "Make sure server and receiver have value",
        type: EMessage.ERROR,
      }));
      return;
    }

    //server-receiver-change-manually-from-client
    const emit = new EmitEvents(socket, dispatch);
    emit.changeServerReceiverManually(actionBody);
    
  
    srChangerEl.current?.close();
  };
  

  return (
    <dialog
      ref={srChangerEl}
      className="modal-dialog bg-gray-900 text-white rounded-xl p-6 w-[90%] max-w-lg shadow-2xl"
    >
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-yellow-400 text-center">
          Change Server / Receiver
        </h2>

        {/* Current Team Display */}
        <div className="flex justify-between gap-4">
          {servingTeam && server && servingPartner && (
            <TeamView
              isServingTeam
              playerA={server}
              playerB={servingPartner}
              team={servingTeam}
            />
          )}
          {receivingTeam && receiver && receivingPartner && (
            <TeamView
              isServingTeam={false}
              playerA={receiver}
              playerB={receivingPartner}
              team={receivingTeam}
            />
          )}
        </div>

        {/* Server / Receiver Selection */}
        <div className="space-y-3">
          <h4 className="text-yellow-400 font-semibold">Select New Roles</h4>
          <form ref={formRef} className="flex flex-col gap-3">
            {/* Server Select */}
            <select
              className="bg-gray-800 p-2 rounded-lg"
              value={selectedServer}
              onChange={(e) => setSelectedServer(e.target.value)}
            >
              <option value="">Select Server</option>
              {getSelectablePlayers(
                teamAPlayerList,
                teamBPlayerList,
                selectedReceiver
              ).map(
                (p) =>
                  p && (
                    <option key={p._id} value={p._id}>
                      {p.firstName} {p.lastName}
                    </option>
                  )
              )}
            </select>

            {/* Receiver Select */}
            <select
              className="bg-gray-800 p-2 rounded-lg"
              value={selectedReceiver}
              onChange={(e) => setSelectedReceiver(e.target.value)}
            >
              <option value="">Select Receiver</option>
              {getSelectablePlayers(
                teamAPlayerList,
                teamBPlayerList,
                selectedServer
              ).map(
                (p) =>
                  p && (
                    <option key={p._id} value={p._id}>
                      {p.firstName} {p.lastName}
                    </option>
                  )
              )}
            </select>
          </form>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            className="bg-gray-700 px-4 py-2 rounded-lg hover:bg-gray-600"
            onClick={() => srChangerEl.current?.close()}
          >
            Cancel
          </button>
          <button
            className="bg-yellow-500 text-black px-4 py-2 rounded-lg hover:bg-yellow-400 font-semibold"
            onClick={handleSubmit}
          >
            Submit
          </button>
        </div>
      </div>
    </dialog>
  );
};

interface TeamViewProps {
  team: ITeam;
  playerA: IPlayer;
  playerB: IPlayer;
  isServingTeam: boolean;
}

const TeamView: React.FC<TeamViewProps> = ({
  team,
  playerA,
  playerB,
  isServingTeam,
}) => (
  <div className="flex-1 border border-gray-700 rounded-xl p-3">
    <h4 className="font-semibold text-center text-blue-400">{team.name}</h4>
    <div className="mt-2 space-y-2">
      <PlayerCard
        player={playerA}
        role={isServingTeam ? ESRRole.SERVER : ESRRole.RECEIVER}
      />
      <PlayerCard
        player={playerB}
        role={isServingTeam ? ESRRole.SWING : ESRRole.SETTER}
      />
    </div>
  </div>
);

interface PlayerCardProps {
  player: IPlayer;
  role: ESRRole;
}

const PlayerCard: React.FC<PlayerCardProps> = ({ player, role }) => (
  <div className="flex items-center gap-3 bg-gray-800 p-2 rounded-lg">
    {player.profile ? (
      <CldImage
        height={50}
        width={50}
        src={player.profile}
        alt={player.firstName}
        className="w-10 h-10 rounded-full"
      />
    ) : (
      <TextImg className="w-10 h-10 rounded-full" fullText={player.firstName} />
    )}
    <div>
      <h5 className="font-medium">
        {player.firstName} {player.lastName}
      </h5>
      <p className="text-sm text-gray-400">{role}</p>
    </div>
  </div>
);

export default ServerReceiverDialog;
