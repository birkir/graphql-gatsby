# graphql-gatsby

This is a library to get direct access to Gatsby's GraphQL generated 
schema and resolvers without using the Gatsby ecosystem in whole.

You can put a `gatsby-config.js` in your project root directory, or pass 
a `config` object as the gatsby config with the plugins.

### Index

- Usage
  - [Manual usage](#manual-usage)
  - [Express](#with-express)
  - [Koa](#with-koa)
  - [NextJS](#with-nextjs)
  - [Razzle](#with-razzle)
- Advanced Topics
   - [Schema stitching](#schema-stitching)

## Usage

### Manual usage

`npm install --save graphql-gatsby` 

```js
const { getGatsbySchema } = require('graphql-gatsby');

getGatsbySchema(config)
.then(({ schema }) => {
  // `schema` is now a usable GraphQL schema
});
```

### With express

`npm install --save graphql-gatsby-express`

Update your server source code to reflect the following changes:
```js
const express = require('express');
const graphqlGatsby = require('graphql-gatsby-express'); // <-- add this line

const app = express();
const config = undefined; // Optional

graphqlGatsby.applyMiddleware({ app, config }); // <-- add this line

app.listen(3000);
```

### With Koa

`npm install --save graphql-gatsby-koa`

Update your server source code to reflect the following changes:
```js
const Koa = require('koa');
const graphqlGatsby = require('graphql-gatsby-koa'); // <-- add this line 

const app = new Koa();
const config = undefined; // Optional

server.applyMiddleware({ app, config }); // <-- add this line

app.listen({ port: 3000 });
```

### With apollo-server

Note: If you already have an apollo server, you may want to look into [Schema stitching](#schema-stitching)
```js
const { ApolloServer } = require('apollo-server');
const { getGatsbySchema } = require('graphql-gatsby');

const config = undefined;

getGatsbySchema(config).then(({ schema }) => {
  const server = new ApolloServer({ schema });
  server.listen();
});
```

### With NextJS

```js
// server.js
const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const graphqlGatsby = require('graphql-gatsby-express'); // <-- add this line

const port = parseInt(process.env.PORT, 10) || 3000;
const dev = process.env.NODE_ENV !== 'production';
const next = require('next')({ dev });
const handle = next.getRequestHandler();

const config = undefined;
graphqlGatsby.bootstrap(config); // <-- add this line (optional)

next.prepare()
.then(async () => {
  const app = express();

  await graphqlGatsby.applyMiddleware({ app }); // <-- add this line

  app.get('*', (req, res) => handle(req, res));

  app.listen(port, err => {
    if (err) throw err
    console.log(`> Ready on http://localhost:${port}`)
  });
});
```

### With Razzle

```js
// src/server.js
import App from './App';
import React from 'react';
import { StaticRouter } from 'react-router-dom';
import express from 'express';
import { renderToString } from 'react-dom/server';
import graphqlGatsby from 'graphql-gatsby-express'; // <-- add this line

const assets = require(process.env.RAZZLE_ASSETS_MANIFEST);

const server = express();

server.applyMiddleware({ app: server }); // <-- add this line

server
  .disable('x-powered-by')
  .use(express.static(process.env.RAZZLE_PUBLIC_DIR))
// ...
```

## Advanced topics

### Schema stitching

If you are already running a graphql server with your own schema, you can stitch the Gatsby schema together with yours, using the `graphql-tools` package.

```js
const { mergeSchemas } = require('graphql-tools');
const { getGatsbySchema } = require('graphql-gatsby');
const mySchema = require('./mySchema');

getGatsbySchema().then(({ schema: gatsbySchema }) => {
  const schema = mergeSchemas({
    schemas: [
      gatsbySchema,
      mySchema
    ]
  });
  
  // `schema` is now ready to be used in an graphql server
});
```

### NextJS Export

It's possible to make the library work with NextJS export feature.

`npm install -S graphql promise-retry isomorphic-fetch`

```js
// next.config.js
const { graphql } = require('graphql');
const graphqlGatsby = require('graphql-gatsby-express');
const fetch = require('isomorphic-fetch');
const promiseRetry = require('promise-retry');

const port = process.env.PORT || 3000;

module.exports = {
  exportPathMap: async (pathMap, options) => {

    // Wait until server becomes ready in export mode
    if (process.argv[1].match(/next-export$/) && !options.dev) {
      await promiseRetry((retry, number) => {
        console.log('waiting for server...', number);
        return fetch(`http://localhost:${port}/graphql?query=%7Bsite%7Bid%7D%7D`)
        .then(res => res.status !== 200 && new Error('Failure'))
        .catch(retry);
      });
      await new Promise(resolve => setTimeout(resolve, 1000)); // sjattlari
    }

    const { schema } = await graphqlGatsby.bootstrap();

    const result = await graphql(schema, `
      query {
        siteMetadata {
          title
        }
      }
    `);

    return {
      ...pathMap
      // ... your custom routes
    };
  }
};
```

Export bash script to ensure having the server running while generating pages (also ensures the server will be killed upon exit). You can run `chmod +x ./export.sh` to make the script executable.

```bash
# ./export.sh

#!/bin/sh
trap "exit" INT TERM ERR
trap "kill 0" EXIT

NODE_ENV=production node server.js > /dev/null 2>&1 &
./node_modules/.bin/next export
```

Update your package.json and then you can run `yarn export` like usual (remember to build the server first with `yarn build`).

```json
// package.json
{
  "scripts": {
    "export": "sh ./export.sh"
  }
}
```

## Common Problems

### message: Cannot use GraphQLSchema "[object Object]" from another module or realm

This is because you are running newer version of GraphQL than Gatsby. You will have to update your package.json with the following resolution (or the version you want to use)

```json
{
  "resolutions": {
    "graphql": "14.0.2"
  }
}
```
