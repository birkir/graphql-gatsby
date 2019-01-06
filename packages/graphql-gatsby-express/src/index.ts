import { ApolloServer, ServerRegistration, gql } from 'apollo-server-express';
import { getGatsbySchema, GetGatsbySchemaConfig } from 'graphql-gatsby';

interface GatsbyMiddlewareOptions {
  app: ServerRegistration["app"];
  config?: GetGatsbySchemaConfig;
}

module.exports = {
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

    getGatsbySchema(config).then(({ schema }) => {
      (server as any).schema = schema;
    });

    server.applyMiddleware({ app });
  }
}
