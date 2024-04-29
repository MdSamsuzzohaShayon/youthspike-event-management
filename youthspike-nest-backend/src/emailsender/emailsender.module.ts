import { Module } from '@nestjs/common';
import { EmailsenderResolver } from './emailsender.resolver';
import { EmailsenderService } from './emailsender.service';
import { SharedModule } from 'src/shared/shared.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [SharedModule, ConfigModule.forRoot()],
  providers: [EmailsenderResolver]
})
export class EmailsenderModule {}
