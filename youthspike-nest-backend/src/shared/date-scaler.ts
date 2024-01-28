import { Scalar, CustomScalar } from '@nestjs/graphql';
import { Kind, ValueNode } from 'graphql';

@Scalar('Date')
export class DateScalar implements CustomScalar<string, Date> {
  description = 'Date custom scalar type';

  parseValue(value: number): Date {
    return new Date(value); // value from the client
  }

  serialize(value: Date): string {
    return new Date(value).toISOString(); // value sent to the client
  }

  parseLiteral(ast: ValueNode): Date {
    if (ast.kind === Kind.INT || ast.kind === Kind.STRING) {
      const date = new Date(ast.value);
      if (date.toString() === 'Invalid Date') return null;
      return date;
    }

    return null;
  }
}
