import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
})
export class LiveStreamGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;

  private activeStreams: Set<string> = new Set();
  private streamDataMap: Map<string, any[]> = new Map();

  afterInit(server: Server) {
    console.log('WebSocket server initialized');
  }

  handleConnection(client: Socket) {
    console.log('Client connected:', client.id);
    client.emit('activeStreams', Array.from(this.activeStreams));
  }

  handleDisconnect(client: Socket) {
    console.log('Client disconnected:', client.id);
  }

  @SubscribeMessage('startStream')
  handleStartStream(client: Socket, payload: { streamId: string }): void {
    this.activeStreams.add(payload.streamId);
    this.streamDataMap.set(payload.streamId, []);
    this.broadcastActiveStreams();
    client.broadcast.emit('streamStarted', payload);
    console.log(`Stream started: ${payload.streamId}`);
  }

  @SubscribeMessage('streamChunk')
  handleStreamChunk(
    client: Socket,
    payload: { streamId: string; chunk: Blob },
  ): void {
    if (this.streamDataMap.has(payload.streamId)) {
      this.streamDataMap.get(payload.streamId)!.push(payload.chunk);
    }
    console.log(`Stream chunk received for: ${payload.streamId}`);
    this.server.emit('streamData', {
      streamId: payload.streamId,
      chunk: payload.chunk,
    });
  }

  @SubscribeMessage('stopStream')
  handleStopStream(client: Socket, payload: { streamId: string }): void {
    this.activeStreams.delete(payload.streamId);
    this.streamDataMap.delete(payload.streamId);
    this.broadcastActiveStreams();
    client.broadcast.emit('streamStopped', payload);
    console.log(`Stream stopped: ${payload.streamId}`);
  }

  @SubscribeMessage('getStream')
  handleGetStream(client: Socket, payload: { streamId: string }): void {
    console.log(`Get stream data for: ${payload.streamId}`);
    const streamData = this.streamDataMap.get(payload.streamId);
    if (streamData) {
      streamData.forEach((chunk) => {
        client.emit('streamData', { streamId: payload.streamId, chunk });
      });
      console.log(
        `Stream data sent for: ${payload.streamId}`,
        streamData.length,
      );
    } else {
      client.emit('streamError', { message: 'Stream not found' });
      console.log(`Stream not found: ${payload.streamId}`);
    }
  }

  private broadcastActiveStreams() {
    this.server.emit('activeStreams', Array.from(this.activeStreams));
  }
}
