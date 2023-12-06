import { Field, ObjectType, Query, Resolver } from '@nestjs/graphql';

@ObjectType()
class AppAbout {
  @Field()
  app: string;

  @Field()
  version: string;

  @Field()
  author: string;
}

@Resolver()
export class AboutResolver {
  @Query((returns) => AppAbout)
  getAbout() {
    return {
      app: 'spikeball-game',
      version: '1.0.0',
      author: 'Ahmad Raza <pro.se.ahmad.raza.1@gmail.com>',
    };
  }
}
