import { Module } from '@nestjs/common';
import { SharedModule } from 'src/shared/shared.module';
import { LdoResolver } from './ldo.resolver';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [SharedModule, ConfigModule.forRoot()],
  providers: [LdoResolver],
})
export class LdoModule {}
