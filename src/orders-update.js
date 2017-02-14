import Ajv from 'ajv'
import bluebird from 'bluebird'
import serializeError from 'serialize-error'
import { SphereClient } from 'sphere-node-sdk'

import orderSchema from './order-schema'
import buildOrderActions from './build-order-actions'

export default class OrdersUpdate {

  constructor (apiClientConfig, logger) {
    this.client = new SphereClient(apiClientConfig)

    this.logger = logger || {
      error: process.stderr.write.bind(process.stderr),
      warn: process.stderr.write.bind(process.stderr),
      info: process.stdout.write.bind(process.stdout),
      verbose: process.stdout.write.bind(process.stdout),
    }

    this.summary = {
      errors: [],
      inserted: [],
      successfullImports: 0,
    }
  }

  // Return JSON string of this.summary object
  // summaryReport :: () -> String
  summaryReport () {
    return JSON.stringify(this.summary, null, 2)
  }

  // Check if order data has required fields and correct types
  // validateOrderData :: Object -> Promise -> Object
  // eslint-disable-next-line class-methods-use-this
  validateOrderData (order) {
    const ajv = new Ajv({ removeAdditional: true })
    const ajvOrder = ajv.compile(orderSchema)

    if (ajvOrder(order))
      return Promise.resolve(order)

    return Promise.reject(ajvOrder.errors)
  }

  // Wrapper function that validates and updates
  // processOrder :: Object -> () -> Object
  processOrder (order) {
    return this.validateOrderData(order)
      .then(this.expandReferences.bind(this))
      .then(this.updateOrder.bind(this))
      .then((result) => {
        this.summary.inserted.push(order.orderNumber)
        this.summary.successfullImports += 1

        return result.body
      })
      .catch((error) => {
        this.summary.errors.push({
          order,
          error: serializeError(error),
        })
      })
  }

  // Get the ID reference from the API with the data key
  // getReferenceFromKey :: (String, String, String) -> Promise -> Object
  getReferenceFromKey (key, typeId, endpoint) {
    return bluebird.props({
      typeId,
      id: this.client[endpoint]
        .where(`key="${key}"`)
        .fetch()
        .then((res) => {
          if (res.body.count === 0)
            return bluebird.reject(new Error(
              `Didn't find any match while resolving ${key} from the API`,
            ))
          return res.body.results[0].id
        }),
    })
  }

  // Wrapper function to make sure passed data returns a reference
  // getReference :: (String, String, String) -> Promise -> Object
  getReference (data, typeId, endpoint) {
    if (data && data.typeId === typeId && data.id)
      return Promise.resolve(data)

    return this.getReferenceFromKey(data, typeId, endpoint)
  }

  // Replace values that reference to something in the API
  // expandReferences :: Object -> Promise -> Object
  expandReferences (order) {
    return bluebird.props({
      ...order,
      // TODO: Refactor code into called function and possible separate modules
      // TODO: Read up the spread
      lineItems: bluebird.map(order.lineItems || [], lineItem =>
        bluebird.props({
          ...lineItem,
          state: bluebird.map(lineItem.state, state =>
            bluebird.props({
              ...state,
              fromState: this.getReference(state.fromState, 'state', 'states'),
              toState: this.getReference(state.toState, 'state', 'states'),
            }),
          ),
        }),
      ),
      customLineItems: bluebird.map(order.customLineItems || [], lineItem =>
        bluebird.props({
          ...lineItem,
          state: bluebird.map(lineItem.state, state =>
            bluebird.props({
              ...state,
              fromState: this.getReference(state.fromState, 'state', 'states'),
              toState: this.getReference(state.toState, 'state', 'states'),
            }),
          ),
        }),
      ),
      syncInfo: bluebird.map(order.syncInfo || [], syncInfo =>
        bluebird.props({
          ...syncInfo,
          channel: this.getReference(syncInfo.channel, 'channel', 'channels'),
        }),
      ),
    })
  }

  // Update order calling the API
  // updateOrder :: Object -> () -> Object
  updateOrder (order) {
    return this.client.orders
      .where(`orderNumber="${order.orderNumber}"`)
      .fetch()
      .then(({ body: { total, results: existingOrders } }) => {
        if (total === 1) {
          const existingOrder = existingOrders[0]
          const actions = this.buildUpdateActions(order)

          // Do not call the API when there are no changes
          if (actions.length > 0)
            return this.client.orders
              .byId(existingOrder.id)
              .update({
                version: existingOrder.version,
                actions,
              })

          return order
        }

        return Promise.reject(Object.assign(
          new Error(`Order with orderNumber ${order.orderNumber} not found.`),
          { code: 'ENOENT' },
        ))
      })
  }

  // Create API action objects based on the order data
  // buildUpdateActions :: Object -> [Object]
  // eslint-disable-next-line class-methods-use-this
  buildUpdateActions (order) {
    const actions = []

    Object.keys(order).forEach((field) => {
      if (typeof buildOrderActions[field] === 'function')
        actions.push(...buildOrderActions[field](order))
    })

    this.logger.verbose(`Build update actions: ${actions}`)
    return actions
  }

  // Wrapper function for compatibility with the CLI
  // processStream :: ([Object], Function) -> ()
  processStream (orders, next) {
    this.logger.info('Starting order processing')
    // process batch
    return bluebird.map(
      orders, order => this.processOrder(order),
    ).then(() => {
      // call next for next batch
      next()
    })
    // errors get catched in the node-cli which also calls for the next chunk
    // if an error occured in this chunk
  }
}
