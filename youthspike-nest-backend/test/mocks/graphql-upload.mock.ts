/**
 * Mock for graphql-upload ESM (.mjs) files.
 *
 * Problem:
 *   graphql-upload ships .mjs (ES Module) files.
 *   Jest runs in CommonJS mode and cannot parse ESM import statements.
 *   This causes: SyntaxError: Cannot use import statement outside a module
 *
 * Solution:
 *   moduleNameMapper in jest config redirects all graphql-upload/*
 *   imports to this file. This file is a normal TypeScript file that
 *   Jest can parse via ts-jest.
 *
 * Exports:
 *   default  → GraphQLUpload scalar (for: import * as X from '.../GraphQLUpload.mjs'; X.default)
 *   GraphQLUpload → named export
 *   FileUpload → interface (for: import { FileUpload } from '.../processRequest.mjs')
 */


import { GraphQLScalarType } from 'graphql';

const GraphQLUpload = new GraphQLScalarType({
  name: 'Upload',
  description: 'Mock GraphQLUpload scalar for Jest tests',
  parseValue: (value: any) => value,
  parseLiteral: (ast: any) => ast.value,
  serialize: (value: any) => value,
});

export default GraphQLUpload;
export { GraphQLUpload };

export interface FileUpload {
  filename: string;
  mimetype: string;
  encoding: string;
  createReadStream: () => any;
}

