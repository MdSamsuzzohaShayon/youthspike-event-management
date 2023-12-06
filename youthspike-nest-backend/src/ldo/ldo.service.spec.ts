import { Test, TestingModule } from '@nestjs/testing';
import { LdoService } from './ldo.service';

describe('LdoService', () => {
  let service: LdoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LdoService],
    }).compile();

    service = module.get<LdoService>(LdoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
