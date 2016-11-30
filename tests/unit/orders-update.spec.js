import OrdersUpdate from 'index'
import { SphereClient } from 'sphere-node-sdk'
import test from 'tape'

let PROJECT_KEY
if (process.env.CI === 'true')
  PROJECT_KEY = process.env.CM_PROJECT_KEY
else
  PROJECT_KEY = process.env.npm_config_projectkey

const apiClientConfig = {
  config: {
    project_key: PROJECT_KEY,
    client_id: '*********',
    client_secret: '*********',
  },
}

const logger = {
  trace: () => {},
  debug: () => {},
  info: () => {},
  error: () => {},
}

test(`OrdersUpdate
  should be an instance`, (t) => {
  t.equal(typeof OrdersUpdate, 'function', 'OrdersUpdate is a class')

  t.end()
})

test(`OrdersUpdate
  should create a sphere client`, (t) => {
  const client = new OrdersUpdate(apiClientConfig).client

  t.true(
    client instanceof SphereClient,
    'OrdersUpdate is an instanceof SphereClient'
  )
  t.end()
})
