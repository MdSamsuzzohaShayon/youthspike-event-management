import { Module } from '@nestjs/common';
import { MyGatWay } from './getway';
import { SharedModule } from 'src/shared/shared.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [SharedModule, ConfigModule.forRoot()],
  providers: [MyGatWay],
})
export class GatewayModule {}
