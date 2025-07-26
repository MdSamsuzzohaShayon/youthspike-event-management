import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { ServerReceiverOnNetService } from './server-receiver-on-net.service';
import { ServerReceiverOnNet } from './server-receiver-on-net.schema';

@Resolver(() => ServerReceiverOnNet)
export class ServerReceiverOnNetResolver {
  constructor(private readonly serverReceiverOnNetService: ServerReceiverOnNetService) {}


}
