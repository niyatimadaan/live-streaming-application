import { SubscribeMessage, WebSocketGateway, WebSocketServer, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: 'http://localhost:5173', credentials: true } })
export class LiveStreamGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  private activeStreams: Map<string, any[]> = new Map();

  afterInit(server: Server) {
    console.log('WebSocket server initialized');
  }

  handleConnection(client: Socket) {
    console.log('Client connected:', client.id);
  }

  handleDisconnect(client: Socket) {
    console.log('Client disconnected:', client.id);
  }

  @SubscribeMessage('startStream')
  handleStartStream(client: Socket, payload: { streamId: string }): void {
    this.activeStreams.set(payload.streamId, []);
    console.log(`Stream started: ${payload.streamId}`);
  }

  @SubscribeMessage('streamChunk')
  handleStreamChunk(client: Socket, payload: { streamId: string, chunk: Blob }): void {
    const chunks = this.activeStreams.get(payload.streamId);
    if (chunks) {
      chunks.push(payload.chunk);
      this.server.emit('streamData', { streamId: payload.streamId, chunk: payload.chunk });
    }
  }

  @SubscribeMessage('stopStream')
  handleStopStream(client: Socket, payload: { streamId: string }): void {
    this.activeStreams.delete(payload.streamId);
    console.log(`Stream stopped: ${payload.streamId}`);
    this.server.emit('streamStopped', payload);
  }

  @SubscribeMessage('getStream')
  handleGetStream(client: Socket, payload: { streamId: string }): void {
    const chunks = this.activeStreams.get(payload.streamId);
    if (chunks) {
      chunks.forEach(chunk => {
        client.emit('streamData', { streamId: payload.streamId, chunk });
      });
      console.log(`Stream data sent for: ${payload.streamId}`);
    } else {
      client.emit('streamError', { message: 'Stream not found' });
      console.log(`Stream not found: ${payload.streamId}`);
    }
  }
}
