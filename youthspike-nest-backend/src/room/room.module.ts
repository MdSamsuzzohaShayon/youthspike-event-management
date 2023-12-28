import { Module } from '@nestjs/common';
import { RoomService } from './room.service';
import { SharedModule } from 'src/shared/shared.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [SharedModule, ConfigModule.forRoot()],
  providers: []
})
export class RoomModule { }
