import { SphereClient } from 'sphere-node-sdk'

export default class OrdersUpdate {

  constructor (apiClientConfig, config = {}, logger) {
    this.client = new SphereClient(
      apiClientConfig
      // Object.assign(apiClientConfig, { user_agent: userAgent })
    )

    this.config = config

    this.logger = logger || {
      error: process.stderr,
      warn: process.stderr,
      info: process.stdout,
      verbose: process.stdout,
    }

    this.summary = {
      errors: [],
      inserted: [],
      successfullImports: 0,
    }
  }
}
