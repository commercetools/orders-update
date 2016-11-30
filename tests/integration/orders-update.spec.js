import OrdersUpdate from 'index'
import { SphereClient } from 'sphere-node-sdk'
import test from 'tape'

let PROJECT_KEY

if (process.env.CI === 'true')
  PROJECT_KEY = process.env.CM_PROJECT_KEY
else
  PROJECT_KEY = process.env.npm_config_projectkey

const logger = {
  trace: () => {},
  debug: () => {},
  info: () => {},
  error: () => {},
}
