import { ConfigService } from '@nestjs/config';
import { Field, ObjectType, Query, Resolver } from '@nestjs/graphql';

@ObjectType()
class AppAbout {
  @Field()
  app: string;

  @Field()
  version: string;

  @Field()
  author: string;

  @Field({ nullable: true })
  mode?: string | null;
}

@Resolver()
export class AboutResolver {
  constructor(private configService: ConfigService) {}

  @Query((returns) => AppAbout)
  getAbout() {
    console.log(this.configService.get<string | null>('NODE_ENV'));
    return {
      app: 'spikeball-game',
      version: '1.0.0',
      author: 'Md Samsuzzoha <mdsamsuzzoha5222@gmail.com>',
      mode: null,
    };
  }
}
