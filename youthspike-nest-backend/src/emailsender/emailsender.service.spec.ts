import { Test, TestingModule } from '@nestjs/testing';
import { EmailsenderService } from './emailsender.service';

describe('EmailsenderService', () => {
  let service: EmailsenderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmailsenderService],
    }).compile();

    service = module.get<EmailsenderService>(EmailsenderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
