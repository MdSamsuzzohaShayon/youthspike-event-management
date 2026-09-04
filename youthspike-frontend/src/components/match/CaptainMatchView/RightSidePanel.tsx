"use client";

import { useMemo } from "react";
import NetCard from "../NetCard";
import { INetRelatives } from "@/types";
import { border } from "@/utils/styles";
import { useAppSelector } from "@/redux/hooks";

const RightSidePanel = () => {
    // Redux state
    const screenWidth = useAppSelector((state) => state.elements.screenWidth);
    const currentNetNumber = useAppSelector((state) => state.nets.currNetNum);
    const currentRoundNets = useAppSelector((state) => state.nets.currentRoundNets);
    const currentRoom = useAppSelector((state) => state.rooms.current);
    const currentRoundId = useAppSelector((state) => state.rounds.current?._id ?? "");

    // Memoization
    const selectedNet = useMemo<INetRelatives | null>(() => {
        if (!currentRoundId) {
            return null;
        }

        return (
            currentRoundNets.find(
                (net) =>
                    net.num === currentNetNumber &&
                    net.round === currentRoundId
            ) ?? null
        );
    }, [currentRoundNets, currentNetNumber, currentRoundId]);

    return (
        <aside
            id="right-net-card"
            className={`flex w-full h-full border ${border.light}`}
        >
            {/* Mobile portrait: show only the selected net */}
            {selectedNet && (
                <div className="block landscape:hidden sm:hidden w-full">
                    <NetCard
                        currRoom={currentRoom}
                        net={selectedNet}
                        screenWidth={screenWidth}
                    />
                </div>
            )}

            {/* Mobile landscape + tablet + desktop: show all nets */}
            <div className="hidden landscape:flex sm:flex w-full">
                {currentRoundNets.map((net) => (
                    <NetCard
                        key={net._id}
                        currRoom={currentRoom}
                        net={net}
                        screenWidth={screenWidth}
                    />
                ))}
            </div>
        </aside>
    );
};

export default RightSidePanel;