import { OnModuleInit } from '@nestjs/common';
import { MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

// @WebSocketGateway({
//     cors: {
//         origin: '*'
//     }
// })

@WebSocketGateway({ cors: true })
export class MyGatWay implements OnModuleInit {
  @WebSocketServer()
  server: Server;

  onModuleInit() {
    this.server.on('connection', (socket) => {
      console.log('socket connected');
    });
  }

  @SubscribeMessage('updateMatch')
  onNewMessage(@MessageBody() body: any) {
    this.server.emit('onMatchUpdate', {
      msg: 'new message',
      content: body,
    });
  }
}
