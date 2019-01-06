const graphqlGatsby = require('graphql-gatsby-express');
const fetch = require('isomorphic-unfetch');
const promiseRetry = require('promise-retry');
const ApolloClient = require('apollo-boost').default;
const gql = require('graphql-tag');

const port = process.env.PORT || 3000;

module.exports = {
  exportPathMap: async (pathMap, options) => {
    if (process.argv[1].match(/next-export$/) && !options.dev) {
      // Wait until server becomes ready in export mode
      await promiseRetry((retry, number) => {
        console.log('waiting for server...', number);
        return fetch(`http://localhost:${port}/graphql?query=%7Bsite%7Bid%7D%7D`)
        .then(res => res.status !== 200 && new Error('Failure'))
        .catch(retry);
      });
      await new Promise(resolve => setTimeout(resolve, 1000)); // shjattlari

      const client = new ApolloClient({ uri: `http://localhost:${port}/graphql` });

      const allMediumPostsQuery = gql`query {
        allMediumPost {
          edges {
            node {
              id
              slug
            }
          }
        }
      }`;
      const res = await client.query({ query: allMediumPostsQuery });

      const posts = [].concat(res.data && res.data.allMediumPost.edges || []).reduce((acc, { node }) => {
        acc[`/post/${node.slug}`] = {
          page: '/post',
          query: { id: node.slug },
        };
        return acc;
      }, {});

      return {
        ...pathMap,
        ...posts
      }
    } else {
      await graphqlGatsby.bootstrap();
    }

    return pathMap;
  }
}
