import { Test, TestingModule } from '@nestjs/testing';
import { AboutResolver } from './about.resolver';

describe('AboutResolver', () => {
  let resolver: AboutResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AboutResolver],
    }).compile();

    resolver = module.get<AboutResolver>(AboutResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
