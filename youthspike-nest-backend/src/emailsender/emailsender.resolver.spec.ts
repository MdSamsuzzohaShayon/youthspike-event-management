import { Test, TestingModule } from '@nestjs/testing';
import { EmailsenderResolver } from './emailsender.resolver';

describe('EmailsenderResolver', () => {
  let resolver: EmailsenderResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmailsenderResolver],
    }).compile();

    resolver = module.get<EmailsenderResolver>(EmailsenderResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
