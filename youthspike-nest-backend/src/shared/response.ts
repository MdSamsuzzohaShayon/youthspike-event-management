import { HttpException, HttpStatus } from '@nestjs/common';
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


  static handleError(error: any) {
    let code = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorDescription = 'Internal server error occurred.';

    if (error instanceof HttpException) {
      const response = error.getResponse();
      const statusCode = response['statusCode'] || HttpStatus.INTERNAL_SERVER_ERROR;
      const message = response['message'] || 'An error occurred.';

      code = statusCode;
      errorDescription = message;
    }

    return { code, success: false, errorDescription };
  }

  static notFound(resource: string) {
    return new AppResponse(HttpStatus.NOT_FOUND, false, `No such ${resource} exists!`);
  }

  static invalidCredentials() {
    return new AppResponse(HttpStatus.NOT_ACCEPTABLE, false, `Invalid credentials!`);
  }

  static invalidFile(msg: string = '') {
    return new AppResponse(HttpStatus.NOT_ACCEPTABLE, false, `Invalid file type! ${msg}`);
  }

  static unauthorized() {
    return new AppResponse(HttpStatus.UNAUTHORIZED, false, `You are not authorized to perform such an action!`);
  }
}
