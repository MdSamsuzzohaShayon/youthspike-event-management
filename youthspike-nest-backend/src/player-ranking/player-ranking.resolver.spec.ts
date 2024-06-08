import { Test, TestingModule } from '@nestjs/testing';
import { PlayerRankingResolver } from './player-ranking.resolver';

describe('PlayerRankingResolver', () => {
  let resolver: PlayerRankingResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PlayerRankingResolver],
    }).compile();

    resolver = module.get<PlayerRankingResolver>(PlayerRankingResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
