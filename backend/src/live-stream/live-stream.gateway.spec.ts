import { Test, TestingModule } from '@nestjs/testing';
import { LiveStreamGateway } from './live-stream.gateway';

describe('LiveStreamGateway', () => {
  let gateway: LiveStreamGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LiveStreamGateway],
    }).compile();

    gateway = module.get<LiveStreamGateway>(LiveStreamGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
