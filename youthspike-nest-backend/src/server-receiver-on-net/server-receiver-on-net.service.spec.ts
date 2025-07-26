import { Test, TestingModule } from '@nestjs/testing';
import { ServerReceiverOnNetService } from './server-receiver-on-net.service';

describe('ServerReceiverOnNetService', () => {
  let service: ServerReceiverOnNetService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ServerReceiverOnNetService],
    }).compile();

    service = module.get<ServerReceiverOnNetService>(ServerReceiverOnNetService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
