import { Module } from '@nestjs/common';
import { SharedModule } from 'src/shared/shared.module';
import { SubResolver } from './sub.resolver';

@Module({
  imports: [SharedModule],
  providers: [SubResolver],
})
export class SubModule {}
