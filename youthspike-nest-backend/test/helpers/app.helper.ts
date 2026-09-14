import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';

export async function buildAppModule(overrides: any = {}): Promise<TestingModule> {
  const builder = Test.createTestingModule({
    imports: [AppModule],
    ...overrides,
  });
  return builder.compile();
}

export async function createE2EApp(): Promise<INestApplication> {
  const moduleRef = await buildAppModule();
  const app = moduleRef.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.init();
  return app;
}