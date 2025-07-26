import { Test, TestingModule } from '@nestjs/testing';
import { ServerReceiverOnNetResolver } from './server-receiver-on-net.resolver';
import { ServerReceiverOnNetService } from './server-receiver-on-net.service';

describe('ServerReceiverOnNetResolver', () => {
  let resolver: ServerReceiverOnNetResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ServerReceiverOnNetResolver, ServerReceiverOnNetService],
    }).compile();

    resolver = module.get<ServerReceiverOnNetResolver>(ServerReceiverOnNetResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
