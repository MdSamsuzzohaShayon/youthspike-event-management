import { Module } from '@nestjs/common';
import { GroupResolver } from './group.resolver';
import { SharedModule } from 'src/shared/shared.module';
import { ConfigModule } from '@nestjs/config';
import { GroupMutations } from './resolvers/groups.mutations';
import { GroupQueries } from './resolvers/groups.queries';
import { GroupFields } from './resolvers/groups.fields';

@Module({
  imports: [SharedModule, ConfigModule.forRoot()],

  providers: [GroupResolver, GroupMutations, GroupQueries, GroupFields],
})
export class GroupModule {}