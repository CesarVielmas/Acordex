import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

export interface PingPayload {
  message?: string;
  [key: string]: unknown;
}

export interface PongResponse {
  event: string;
  data: string;
  receivedPayload?: PingPayload;
  timestamp: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/',
})
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(EventsGateway.name);

  afterInit(): void {
    this.logger.log('Events WebSocket Gateway initialized successfully.');
  }

  handleConnection(client: Socket): void {
    this.logger.log(`WebSocket client connected: [id: ${client.id}]`);
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`WebSocket client disconnected: [id: ${client.id}]`);
  }

  @SubscribeMessage('ping')
  handlePing(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: PingPayload,
  ): PongResponse {
    this.logger.debug(
      `Received 'ping' from client ${client.id}: ${JSON.stringify(payload)}`,
    );

    return {
      event: 'pong',
      data: 'pong',
      receivedPayload: payload,
      timestamp: new Date().toISOString(),
    };
  }
}
