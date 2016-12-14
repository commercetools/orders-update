import Ajv from 'ajv'
import Promise from 'bluebird'
import { SphereClient } from 'sphere-node-sdk'

import orderSchema from './order-schema'

const ajv = new Ajv({ removeAdditional: true })

export default class OrdersUpdate {

  constructor (apiClientConfig) {
    this.client = new SphereClient(apiClientConfig)

    this.summary = {
      errors: [],
      inserted: [],
      successfullImports: 0,
    }
  }

  summaryReport () {
    return JSON.stringify(this.summary, null, 2)
  }

  // eslint-disable-next-line class-methods-use-this
  validateOrderData (order) {
    const validatedOrderData = ajv.compile(orderSchema)(order)

    if (validatedOrderData)
      return Promise.resolve(order)

    return Promise.reject(`Validation error: ${validatedOrderData.errors}`)
  }

  processOrder (order) {
    return this.validateOrderData(order)
      .then(this.updateOrder.bind(this))
      .then((result) => {
        this.summary.inserted.push(order.orderNumber)
        this.summary.successfullImports += 1

        return result.body
      })
      .catch((error) => {
        this.summary.errors.push({ order, error })
      })
  }

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

  // eslint-disable-next-line class-methods-use-this
  buildUpdateActions (order) {
    const actions = []

    if (order.lineItems)
      order.lineItems.forEach((lineItem) => {
        if (lineItem.state)
          lineItem.state.forEach((state) => {
            if (state.fromState && state.toState) {
              const action = {
                action: 'transitionLineItemState',
                lineItemId: lineItem.id,
                quantity: state.quantity,
                fromState: state.fromState,
                toState: state.toState,
              }

              // Check for optional fields
              if (state.actualTransitionDate)
                action.actualTransitionDate = state.actualTransitionDate

              actions.push(action)
            }
          })
      })

    return actions
  }

  processStream (orders, next) {
    // process batch
    return Promise.map(
      orders, order => this.processOrder(order),
    ).then(() => {
      // call next for next batch
      next()
    })
    // errors get catched in the node-cli which also calls for the next chunk
    // if an error occured in this chunk
  }
}
