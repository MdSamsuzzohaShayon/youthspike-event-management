import { Module } from '@nestjs/common';
import { GroupResolver } from './group.resolver';
import { SharedModule } from 'src/shared/shared.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [SharedModule, ConfigModule.forRoot()],

  providers: [GroupResolver],
})
export class GroupModule {}