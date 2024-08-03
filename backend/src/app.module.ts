import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { VideoModule } from './video/video.module';
import { LiveStreamGateway } from './live-stream/live-stream.gateway';

@Module({
  imports: [VideoModule],
  controllers: [AppController],
  providers: [AppService, LiveStreamGateway],
})
export class AppModule {}
