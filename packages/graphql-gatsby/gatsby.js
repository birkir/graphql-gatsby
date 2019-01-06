const _ = require(`lodash`)
const slash = require(`slash`)
const apiRunnerNode = require(`gatsby/dist/utils/api-runner-node`)
const getBrowserslist = require(`gatsby/dist/utils/browserslist`)
const { graphql } = require(`graphql`)
const { store, emitter } = require(`gatsby/dist/redux`)
const loadPlugins = require(`gatsby/dist/bootstrap/load-plugins`)
const report = require(`gatsby-cli/lib/reporter`)
const getConfigFile = require(`gatsby/dist/bootstrap/get-config-file`)
const tracer = require(`opentracing`).globalTracer()
const preferDefault = require(`gatsby/dist/bootstrap/prefer-default`)
const nodeTracking = require(`gatsby/dist/db/node-tracking`)
require(`gatsby/dist/db`).startAutosave()

// Show stack trace on unhandled promises.
process.on(`unhandledRejection`, (reason, p) => {
  report.panic(reason)
})

module.exports = async (args) => {

  const graphqlRunner = (query, context = {}) => {
    const schema = store.getState().schema
    return graphql(schema, query, context, context, context)
  }

  const state = store.getState();

  if (state.init) {
    if (state.jobs.active.length > 0) {
      console.log('GRAPHQL_GATSBY: WAITING');
      return new Promise((resolve) => {
        store.on('BOOTSTRAP_FINISHED', () =>
          resolve({ graphqlRunner, store, schema: store.getState().schema }));
      });
    }
    console.log('GRAPHQL_GATSBY: NOT WAITING');
    return { graphqlRunner, store, schema: store.getState().schema };
  }

  const spanArgs = args.parentSpan ? { childOf: args.parentSpan } : {}
  const bootstrapSpan = tracer.startSpan(`bootstrap`, spanArgs)

  // Start plugin runner which listens to the store
  // and invokes Gatsby API based on actions.
  require(`gatsby/dist/redux/plugin-runner`)

  const directory = slash(args.directory)

  const program = {
    ...args,
    browserslist: getBrowserslist(directory),
    // Fix program directory path for windows env.
    directory,
  }

  store.dispatch({
    type: `SET_PROGRAM`,
    payload: program,
  })

  // Try opening the site's gatsby-config.js file.
  let activity = report.activityTimer(`open and validate gatsby-configs`, {
    parentSpan: bootstrapSpan,
  })
  activity.start()

  let config = args.config;

  if (!config) {
    config = await preferDefault(
      getConfigFile(program.directory, `gatsby-config`)
    )
  }

  store.dispatch({
    type: `SET_SITE_CONFIG`,
    payload: config,
  })
  activity.end()

  activity = report.activityTimer(`load plugins`)
  activity.start()
  await loadPlugins(config)
  activity.end()

  // onPreInit
  activity = report.activityTimer(`onPreInit`, {
    parentSpan: bootstrapSpan,
  })
  activity.start()
  await apiRunnerNode(`onPreInit`, { parentSpan: activity.span })
  activity.end()

  // By now, our nodes database has been loaded, so ensure that we
  // have tracked all inline objects
  nodeTracking.trackDbNodes()

  // onPreBootstrap
  activity = report.activityTimer(`onPreBootstrap`)
  activity.start()
  await apiRunnerNode(`onPreBootstrap`)
  activity.end()

  // Source nodes
  activity = report.activityTimer(`source and transform nodes`, {
    parentSpan: bootstrapSpan,
  })
  activity.start()
  await require(`gatsby/dist/utils/source-nodes`)({ parentSpan: activity.span })
  activity.end()

  // Create Schema.
  activity = report.activityTimer(`building schema`, {
    parentSpan: bootstrapSpan,
  })
  activity.start()
  await require(`gatsby/dist/schema`).build({ parentSpan: activity.span })
  activity.end()

  activity = report.activityTimer(`onPreExtractQueries`, {
    parentSpan: bootstrapSpan,
  })
  activity.start()
  await apiRunnerNode(`onPreExtractQueries`, { parentSpan: activity.span })
  activity.end()

  // Update Schema for SitePage.
  activity = report.activityTimer(`update schema`, {
    parentSpan: bootstrapSpan,
  })
  activity.start()
  await require(`gatsby/dist/schema`).build({ parentSpan: activity.span })
  activity.end()

  require(`gatsby/dist/schema/type-conflict-reporter`).printConflicts()

  const checkJobsDone = _.debounce(resolve => {
    const state = store.getState()
    if (state.jobs.active.length === 0) {
      report.log(``)
      report.info(`bootstrap finished - ${process.uptime()} s`)
      report.log(``)

      // onPostBootstrap
      activity = report.activityTimer(`onPostBootstrap`, {
        parentSpan: bootstrapSpan,
      })
      activity.start()
      apiRunnerNode(`onPostBootstrap`, { parentSpan: activity.span }).then(
        () => {
          activity.end()
          bootstrapSpan.finish()
          resolve({ graphqlRunner, store, schema: store.getState().schema })
        }
      )
    }
  }, 100)

  if (store.getState().jobs.active.length === 0) {
    // onPostBootstrap
    activity = report.activityTimer(`onPostBootstrap`, {
      parentSpan: bootstrapSpan,
    })
    activity.start()
    await apiRunnerNode(`onPostBootstrap`, { parentSpan: activity.span })
    activity.end()

    bootstrapSpan.finish()

    report.log(``)
    report.info(`bootstrap finished - ${process.uptime()} s`)
    report.log(``)
    emitter.emit(`BOOTSTRAP_FINISHED`)

    return {
      store,
      graphqlRunner,
      schema: store.getState().schema
    }
  } else {
    return new Promise(resolve => {
      // Wait until all side effect jobs are finished.
      emitter.on(`END_JOB`, () => checkJobsDone(resolve))
    })
  }
}
