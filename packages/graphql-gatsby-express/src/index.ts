import { ApolloServer, ServerRegistration } from 'apollo-server-express';
import { getGatsbySchema, GetGatsbySchemaConfig } from 'graphql-gatsby';

interface GatsbyMiddlewareOptions {
  app: ServerRegistration["app"];
  config?: GetGatsbySchemaConfig;
}

export default {
  applyMiddleware({ app, config }: GatsbyMiddlewareOptions) {
    return getGatsbySchema(config).then(({ schema }) => {
      const server = new ApolloServer({
        schema
      });

      return server.applyMiddleware({ app });
    });
  }
}
