import React from 'react';
import { withRouter } from 'next/router';
import Link from 'next/link';
import { Query } from 'react-apollo';
import gql from 'graphql-tag';

const mediumPostById = gql`
  query mediumPostById(
    $id: String
  ) {
    mediumPost(
      slug: { eq: $id }
    ) {
      id
      title
      slug
      author {
        username
      }
      previewContent {
        subtitle
      }
    }
  }
`;

export default withRouter(({ router }) => (
  <Query
    query={mediumPostById}
    variables={{
      id: router.query && router.query.id,
    }}
  >
    {({ loading, error, data }) => {
      if (loading) return <p>Loading...</p>;
      if (error) return <p>Error :(</p>;
      return (
        <>
          <div>
            <h1>{data.mediumPost.title}</h1>
            <em>by {data.mediumPost.author.username}</em>
            <p>{data.mediumPost.previewContent.subtitle}</p>
          </div>
          <Link href="/"><a>Go back</a></Link>
        </>
      );
    }}
  </Query>
));
