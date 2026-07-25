import { Module } from '@nestjs/common';
import { BadgeResolver } from './badge.resolver';
import { SharedModule } from 'src/shared/shared.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [SharedModule, ConfigModule.forRoot()],
  providers: [BadgeResolver]
})
export class BadgeModule {}
