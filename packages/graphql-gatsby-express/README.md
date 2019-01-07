# graphql-gatsby-express

## Install

```bash
npm install --save graphql-gatsby-express
```

## Usage

```js
const express = require('express');
const graphqlGatsby = require('graphql-gatsby-express'); // <-- add this line

const app = express();
const config = undefined; // Optional

graphqlGatsby.applyMiddleware({ app, config }); // <-- add this line

app.listen(3000);
```


## Problems

Report problems to GitHub Issue Tracker
