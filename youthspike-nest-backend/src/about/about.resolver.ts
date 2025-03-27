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

  @Field()
  details: string;

  @Field({ nullable: true })
  mode?: string | null;
}

@Resolver()
export class AboutResolver {
  constructor(private configService: ConfigService) { }

  @Query((returns) => AppAbout)
  getAbout() {
    // Get the PM2-assigned port
    const port = this.configService.get<string | null>('PORT') || process.env.PORT || 'Unknown';

    // Get the running environment
    const mode = this.configService.get<string | null>('NODE_ENV') || process.env.NODE_ENV || 'development';

    console.log(`Running mode: ${mode}, Port: ${port}`);

    return {
      app: 'spikeball-game',
      version: '1.0.0',
      author: 'Md Samsuzzoha <mdsamsuzzoha5222@gmail.com>',
      mode: null,
      details: `Server is running on ${process.env.PORT}`
    };
  }
}
