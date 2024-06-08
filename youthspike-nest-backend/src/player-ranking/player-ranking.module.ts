import { Module } from '@nestjs/common';
import { PlayerRankingResolver } from './player-ranking.resolver';
import { SharedModule } from 'src/shared/shared.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [SharedModule, ConfigModule.forRoot()],
  providers: [PlayerRankingResolver]
})
export class PlayerRankingModule {}
