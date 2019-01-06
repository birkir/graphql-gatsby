import { ApolloServer, ServerRegistration, gql } from 'apollo-server-express';
import { getGatsbySchema, GetGatsbySchemaConfig } from 'graphql-gatsby';

interface GatsbyMiddlewareOptions {
  app: ServerRegistration["app"];
  config?: GetGatsbySchemaConfig;
}

module.exports = {
  initialize(config: GetGatsbySchemaConfig) {
    return getGatsbySchema(config);
  },
  applyMiddleware({ app, config }: GatsbyMiddlewareOptions) {
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

    server.applyMiddleware({ app });

    return getGatsbySchema(config).then(({ schema }) => {
      (server as any).schema = schema;
    });
  }
}
