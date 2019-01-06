const express = require('express');
const graphqlGatsby = require('graphql-gatsby-express');

const port = parseInt(process.env.PORT, 10) || 3000;
const dev = process.env.NODE_ENV !== 'production';
const next = require('next')({ dev });
const handle = next.getRequestHandler();

const config = {
  plugins: [{
    resolve: 'gatsby-source-medium',
    options: {
      username: '@birkir.gudjonsson',
      limit: 10
    }
  }]
};

graphqlGatsby.bootstrap(config);

next.prepare()
.then(async () => {

  const app = express();

  await graphqlGatsby.applyMiddleware({ app });

  app.get('/post/:id', (req, res) =>
    next.render(req, res, '/post', req.params));

  app.get('*', (req, res) => handle(req, res));

  app.listen(port, err => {
    if (err) throw err
    console.log(`> Ready on http://localhost:${port}`)
  });

});
