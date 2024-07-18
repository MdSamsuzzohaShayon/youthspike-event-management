import { ICreateNewEventProps } from "@/types";

function createNewEvent({ socket, eventId }: ICreateNewEventProps) {
    if (socket) socket.emit('create-event-from-client', { eventId });
}



export { createNewEvent };
