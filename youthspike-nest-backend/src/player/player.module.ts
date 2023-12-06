import { Module } from '@nestjs/common';
import { SharedModule } from 'src/shared/shared.module';
import { PlayerResolver } from './player.resolver';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [SharedModule, ConfigModule.forRoot()],

  providers: [PlayerResolver],
})
export class PlayerModule {}
