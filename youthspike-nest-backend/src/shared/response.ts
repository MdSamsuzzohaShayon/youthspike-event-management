import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class AppResponse<Type = null> {
  @Field((type) => Int)
  readonly code: number;

  @Field()
  readonly success: boolean;

  @Field({ nullable: true })
  readonly message?: string;

  constructor(code: number, success: boolean, message?: string) {
    this.code = code;
    this.success = success;
    this.message = message;
  }

  static handleError(obj: any) {
    if (obj instanceof AppResponse) return obj;
    return new AppResponse(406, false, JSON.stringify(obj));
  }

  static getError(obj: any) {
    if (obj instanceof AppResponse) return obj;
    return new AppResponse(500, false, 'Something went wrong!');
  }

  static exists(resource: string) {
    return new AppResponse(400, false, `Such a ${resource} exists!`);
  }

  static notFound(resource: string) {
    return new AppResponse(404, false, `No such ${resource} exists!`);
  }

  static invalidCredentials() {
    return new AppResponse(406, false, `Invalid credentials!`);
  }

  static invalidFile(msg: string = '') {
    return new AppResponse(406, false, `Invalid file type! ${msg}`);
  }

  static unauthorized() {
    return new AppResponse(403, false, `You are not authorized to perform such an action!`);
  }
}
