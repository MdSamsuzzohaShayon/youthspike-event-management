import { Module } from '@nestjs/common';
import { SharedModule } from 'src/shared/shared.module';
import { RoundResolver } from './round.resolver';
import { ConfigModule } from '@nestjs/config';
@Module({
  imports: [SharedModule, ConfigModule.forRoot()],

  providers: [RoundResolver],
})
export class RoundModule {}
