import { Module } from '@nestjs/common';
import { MyGatWay } from './getway';

@Module({
  providers: [MyGatWay],
})
export class GatewayModule {}
