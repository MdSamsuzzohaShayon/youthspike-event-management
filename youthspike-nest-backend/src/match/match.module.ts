import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SharedModule } from 'src/shared/shared.module';
import { MatchResolver } from './match.resolver';

@Module({
  imports: [SharedModule, ConfigModule.forRoot()],

  providers: [MatchResolver],
})
export class MatchModule {}
