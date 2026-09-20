import { INestApplication } from '@nestjs/common';
import request from 'supertest';

export interface GqlRequestOptions {
  query: string;
  variables?: Record<string, any>;
  token?: string;
  headers?: Record<string, string>;
}

export async function gqlRequest(app: INestApplication, opts: GqlRequestOptions) {
  const req = request(app.getHttpServer())
    .post('/graphql')
    .set('Content-Type', 'application/json');

  if (opts.token) req.set('Authorization', `Bearer ${opts.token}`);
  if (opts.headers) {
    for (const [k, v] of Object.entries(opts.headers)) req.set(k, v);
  }

  return req.send({ query: opts.query, variables: opts.variables });
}



/** Sends a GraphQL query/mutation via HTTP for E2E testing. */
export async function graphqlRequest(
  app: INestApplication,
  query: string,
  variables: Record<string, any> = {},
  token?: string,
) {
  const req = request(app.getHttpServer())
    .post('/graphql')
    .send({ query, variables });

  if (token) req.set('Authorization', `Bearer ${token}`);
  return req;
}