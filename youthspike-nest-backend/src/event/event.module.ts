import { Module } from '@nestjs/common';
import { EventResolver } from './event.resolver';
import { SharedModule } from 'src/shared/shared.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [SharedModule, ConfigModule.forRoot()],

  providers: [EventResolver],
})
export class EventModule {}
