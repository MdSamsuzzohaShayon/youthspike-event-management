import { Module } from '@nestjs/common';
import { ServerReceiverOnNetResolver } from './server-receiver-on-net.resolver';
import { SharedModule } from 'src/shared/shared.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [SharedModule, ConfigModule.forRoot()],

  providers: [ServerReceiverOnNetResolver],
})
export class ServerReceiverOnNetModule {}
