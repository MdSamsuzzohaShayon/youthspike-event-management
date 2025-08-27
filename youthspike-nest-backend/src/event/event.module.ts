import { Module } from '@nestjs/common';
import { EventResolver } from './event.resolver';
import { SharedModule } from 'src/shared/shared.module';
import { ConfigModule } from '@nestjs/config';
import { EventMutations } from './resolvers/event.mutations';
import { EventQueries } from './resolvers/event.queries';
import { EventFields } from './resolvers/event.fields';

@Module({
  imports: [SharedModule, ConfigModule.forRoot()],

  providers: [EventResolver, EventMutations, EventQueries, EventFields],
})
export class EventModule {}
