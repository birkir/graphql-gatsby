import React from 'react';
import { Query } from 'react-apollo';
import Link from 'next/link';
import gql from 'graphql-tag';

const allMediumPosts = gql`
  query allMediumPosts {
    allMediumPost {
      edges {
        node {
          id
          slug
          title
        }
      }
    }
  }
`;

export default () => (
  <>
    <h3>Blog posts</h3>
    <ul>
      <Query query={allMediumPosts}>
        {({ loading, error, data }) => {
          if (loading) return <p>Loading...</p>;
          if (error) return <p>Error :(</p>;
          return data.allMediumPost.edges.map(({ node }) => (
            <li key={node.id}>
              <Link as={`/post/${node.slug}`} href={`/post?id=${node.slug}`}>
                <a>
                  {node.title}
                </a>
              </Link>
            </li>
          ));
        }}
      </Query>
    </ul>
  </>
);
