import { Test, TestingModule } from '@nestjs/testing';
import { SponsorResolver } from './sponsor.resolver';

describe('SponsorResolver', () => {
  let resolver: SponsorResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SponsorResolver],
    }).compile();

    resolver = module.get<SponsorResolver>(SponsorResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
