# graphql-gatsby-koa

## Install

```bash
npm install --save graphql-gatsby-koa
```

## Usage

```js
const Koa = require('koa');
const graphqlGatsby = require('graphql-gatsby-koa'); // <-- add this line 

const app = new Koa();
const config = undefined; // Optional

server.applyMiddleware({ app, config }); // <-- add this line

app.listen({ port: 3000 });
```
