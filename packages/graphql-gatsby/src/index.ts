import path from 'path';
import pkgDir from 'pkg-dir';
import { GraphQLSchema } from 'graphql';
import { Store } from 'redux';

const gatsby = require('../gatsby.js');

type Plugin = string | {
  resolve: string;
  options?: {
    [key: string]: any;
  }
};

export interface GetGatsbySchemaConfig {
  plugins?: Plugin[];
}

export interface GetGatsbySchemaResult {
  schema: GraphQLSchema;
  store: Store;
  graphqlRunner(query: any, context: any): void;
}

export function getGatsbySchema(config?: GetGatsbySchemaConfig): Promise<GetGatsbySchemaResult> {

  const directory = pkgDir.sync(process.cwd());

  const program = {
    init: true,
    directory,
    sitePackageJson: directory ? require.resolve(path.join(directory, 'package.json')) : {},
    prefixPaths: false,
    noUglify: true,
    config,
  };

  return gatsby(program);
}
