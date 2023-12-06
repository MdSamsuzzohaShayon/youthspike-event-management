import { Module } from '@nestjs/common';
import { SharedModule } from 'src/shared/shared.module';
import { NetResolver } from './net.resolver';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [SharedModule, ConfigModule.forRoot()],

  providers: [NetResolver],
})
export class NetModule {}
