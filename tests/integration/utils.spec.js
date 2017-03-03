import getApiCredentials from 'get-api-credentials'
import OrdersUpdate from 'orders-update'
import bluebird from 'bluebird'

import productTypeSample from '../helpers/product-type-sample.json'
import productSample from '../helpers/product-sample.json'
import orderSample from '../helpers/order-sample'
import stateSamples from '../helpers/state-samples.json'

export function setup ({ projectKey, endpoints, channel }) {
  let ordersUpdate
  return initOrderUpdate(projectKey)
    .then((_ordersUpdate) => {
      ordersUpdate = _ordersUpdate
      return ordersUpdate
    })
    .then(() => cleanProject(ordersUpdate.client, endpoints))
    // Create needed data
    .then(() => ordersUpdate.client.channels.ensure(channel.key, channel.role))
    .then(() => ordersUpdate.client.productTypes.create(productTypeSample))
    .then(() => ordersUpdate.client.products.create(productSample))
    .then(() => Promise.all([
      ordersUpdate.client.states.create(stateSamples[0]),
      ordersUpdate.client.states.create(stateSamples[1]),
    ]))
    // Import order sample with filled in state IDs
    .then((results) => {
      const order = orderSample()
      order.lineItems[0].state[0].state.id = results[0].body.id
      order.lineItems[0].state[1].state.id = results[1].body.id
      order.customLineItems[0].state[0].state.id = results[0].body.id
      order.customLineItems[0].state[1].state.id = results[1].body.id

      return ordersUpdate.client.orders.import(order)
    })
}

export function modifyOrder (order, channelKey) {
  const modifiedOrder = Object.assign({}, order)
  modifiedOrder.lineItems[0].state = [
    {
      quantity: 1,
      fromState: stateSamples[0].key,
      toState: stateSamples[1].key,
      _fromStateQty: 9000,
      actualTransitionDate: '2016-12-23T18:00:00.000Z',
    },
  ]
  modifiedOrder.customLineItems[0].state = [
    {
      quantity: 3,
      fromState: stateSamples[0].key,
      toState: stateSamples[1].key,
      _fromStateQty: 55,
      actualTransitionDate: '2016-12-23T20:00:00.000Z',
    },
  ]
  modifiedOrder.syncInfo = [{
    channel: channelKey,
    externalId: channelKey,
  }]
  return modifiedOrder
}

export function initOrderUpdate (projectKey) {
  return getApiCredentials(projectKey)
    .then(apiCredentials =>
      new OrdersUpdate(
        {
          config: apiCredentials,
        },
        {
          error: () => {},
          warn: () => {},
          info: () => {},
          verbose: () => {},
        },
      ),
    )
}

export function cleanProject (client, endpoints) {
  return bluebird.each(
    endpoints,
    clearEndpointData.bind(null, client),
  )
}

// Delete all API items from a given endpoint
export function clearEndpointData (client, service) {
  return client[service]
    .all().fetch()
    .then(data => data.body.results.filter(item => !item.builtIn))
    .then(items => Promise.all(
      items.map(item => client[service]
        .byId(item.id)
        .delete(item.version)),
      ),
    )
}
