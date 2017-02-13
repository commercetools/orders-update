import bluebird from 'bluebird'
import getApiCredentials from 'get-api-credentials'
import OrdersUpdate from 'orders-update'
import test from 'tape'

import productTypeSample from '../helpers/product-type-sample.json'
import productSample from '../helpers/product-sample.json'
import orderSample from '../helpers/order-sample'
import stateSamples from '../helpers/state-samples.json'

const PROJECT_KEY =
  process.env.CT_PROJECT_KEY || process.env.npm_config_projectkey

const channelKey = 'OrderCsvFileExport'
const channelRole = 'OrderExport'

// Delete all API items from a given endpoint
const clearEndpointData = (client, service) =>
  client[service]
    .all().fetch()
    .then(data => data.body.results.filter(item => !item.builtIn))
    .then(items => Promise.all(
      items.map(item => client[service]
        .byId(item.id)
        .delete(item.version)),
      ),
    )

test('the module should modify an existing order', (t) => {
  let ordersUpdate

  getApiCredentials(PROJECT_KEY)
    .then((apiCredentials) => {
      ordersUpdate = new OrdersUpdate({
        config: apiCredentials,
      })
    })
    // Clean up, remove everything from used services in testing
    .then(() =>
      bluebird.each(
        ['orders', 'products', 'productTypes', 'states'],
        clearEndpointData.bind(null, ordersUpdate.client),
      ),
    )
    // Create needed data
    .then(() => ordersUpdate.client.channels.ensure(channelKey, channelRole))
    .then(() => ordersUpdate.client.productTypes.create(productTypeSample))
    .then(() => ordersUpdate.client.products.create(productSample))
    .then(() => Promise.all([
      ordersUpdate.client.states.create(stateSamples[0]),
      ordersUpdate.client.states.create(stateSamples[1]),
      ordersUpdate.client.states.create(stateSamples[2]),
      ordersUpdate.client.states.create(stateSamples[3]),
    ]))
    // Import order sample with filled in state IDs
    .then((results) => {
      const order = orderSample()
      order.lineItems[0].state[0].state.id = results[0].body.id
      order.lineItems[0].state[1].state.id = results[1].body.id
      order.customLineItems[0].state[0].state.id = results[2].body.id
      order.customLineItems[0].state[1].state.id = results[3].body.id

      return ordersUpdate.client.orders.import(order)
    })
    // Modify data and send to module
    .then((orderResult) => {
      const modifiedOrder = Object.assign({}, orderResult.body)
      modifiedOrder.lineItems[0].state = [
        {
          quantity: 1,
          fromState: stateSamples[0].key,
          toState: stateSamples[1].key,
          actualTransitionDate: '2016-12-23T18:00:00.000Z',
        },
      ]
      modifiedOrder.customLineItems[0].state = [
        {
          quantity: 3,
          fromState: stateSamples[2].key,
          toState: stateSamples[3].key,
          actualTransitionDate: '2016-12-23T20:00:00.000Z',
        },
      ]
      modifiedOrder.syncInfo = [{
        channel: channelKey,
        externalId: channelKey,
      }]

      return ordersUpdate.processOrder(modifiedOrder)
    })
    .then(order => ordersUpdate.client.orders
        .where(`orderNumber="${order.orderNumber}"`)
        .fetch())
    // Check if data is modified as expected
    .then(({ body: { results: orders } }) => {
      const order = orders[0]
      t.equal(
        order.lineItems[0].state[0].quantity, 8999,
        'quantity of line item should be modified',
      )

      t.equal(
        order.lineItems[0].state[1].quantity, 2,
        'quantity of line item should be modified',
      )

      t.equal(
        order.customLineItems[0].state[0].quantity, 52,
        'quantity of custom line item should be modified',
      )

      t.equal(
        order.customLineItems[0].state[1].quantity, 48,
        'quantity of custom line item should be modified',
      )

      t.equal(
        order.syncInfo[0].externalId,
        channelKey,
        'SyncInfo is set',
      )

      t.end()
    })
    .catch((error) => {
      console.log(JSON.stringify(error, null, 2))
      t.fail()
    })
})
