import { Socket } from "socket.io-client";

export interface ICreateNewEventProps {
    eventId: string;
    socket: Socket | null;
}