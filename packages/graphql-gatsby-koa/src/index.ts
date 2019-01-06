import { ApolloServer, ServerRegistration, gql } from 'apollo-server-koa';
import { getGatsbySchema, GetGatsbySchemaConfig } from 'graphql-gatsby';

interface GatsbyMiddlewareOptions {
  app: ServerRegistration["app"];
  config?: GetGatsbySchemaConfig;
}

export default {
  applyMiddleware({ app, config }: GatsbyMiddlewareOptions) {
    return getGatsbySchema(config).then(({ schema }) => {
      const typeDefs = gql`
        type Query {
          loading: Boolean
        }
      `;

      const resolvers = {
        Query: {
          loading: () => true
        },
      };

      const server = new ApolloServer({
        typeDefs,
        resolvers,
      });

      getGatsbySchema(config).then(({ schema }) => {
        (server as any).schema = schema;
      });

      server.applyMiddleware({ app });
    });
  }
}
