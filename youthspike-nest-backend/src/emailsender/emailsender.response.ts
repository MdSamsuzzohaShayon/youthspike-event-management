import { Field, ObjectType } from "@nestjs/graphql";
import { Emailcontent, Emailsender } from "./emailsernder.schema";

@ObjectType()
export class CustomEmailsender extends Emailsender {

    @Field((_type) => String, { nullable: false })
    event: string;

    @Field((_type) => [String], { nullable: true })
    emailcontents: string[];
}

@ObjectType()
export class CustomEmailcontent extends Emailcontent {

    @Field((_type) => String, { nullable: false })
    player: string;

    @Field((_type) => String, { nullable: false })
    team: string;

    @Field((_type) => String, { nullable: false })
    emailsender: string;
}