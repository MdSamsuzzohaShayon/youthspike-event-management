import { Module } from '@nestjs/common';
import { SponsorResolver } from './sponsor.resolver';

@Module({
  providers: [SponsorResolver]
})
export class SponsorModule {}
