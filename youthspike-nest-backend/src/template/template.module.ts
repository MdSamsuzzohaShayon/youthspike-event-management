import { Module } from '@nestjs/common';
import { SharedModule } from 'src/shared/shared.module';
import { ConfigModule } from '@nestjs/config';
import { TemplateResolver } from './template.resolver';
import { TemplateQueries } from './resolvers/template.queries';
import { TemplateFields } from './resolvers/template.fields';
import { TemplateMutations } from './resolvers/template.mutations';

@Module({
  imports: [SharedModule, ConfigModule.forRoot()],
  providers: [TemplateResolver, TemplateQueries, TemplateFields, TemplateMutations],
})
export class TemplateModule {}
