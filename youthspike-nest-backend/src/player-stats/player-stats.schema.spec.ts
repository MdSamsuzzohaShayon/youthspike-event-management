import { Test, TestingModule } from '@nestjs/testing';
import { PlayerStatsSchema } from './player-stats.schema';

describe('PlayerStatsSchema', () => {
  let schema: typeof PlayerStatsSchema;

  beforeEach(() => {
    schema = PlayerStatsSchema;
  });

  it('should be defined', () => {
    expect(schema).toBeDefined();
  });
});
