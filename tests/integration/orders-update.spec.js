import test from 'tape'

import { setup, modifyOrder, initOrderUpdate } from './utils.spec'

const PROJECT_KEY =
  process.env.CT_PROJECT_KEY || process.env.npm_config_projectkey

const channelKey = 'OrderCsvFileExport'
const channelRole = 'OrderExport'

test('the module should modify an existing order', (t) => {
  let ordersUpdate
  const params = {
    projectKey: PROJECT_KEY,
    endpoints: ['orders', 'products', 'productTypes', 'states'],
    channel: {
      key: channelKey,
      role: channelRole,
    },
  }

  setup(params)
    // Modify data and send to module
    .then(orderResult =>
      initOrderUpdate(PROJECT_KEY)
        .then((_ordersUpdate) => {
          ordersUpdate = _ordersUpdate
          const modifiedOrder = modifyOrder(orderResult.body, channelKey)
          return ordersUpdate.processOrder(modifiedOrder)
        }),
    )
    .then(order =>
      ordersUpdate.client.orders
        .where(`orderNumber="${order.orderNumber}"`)
        .fetch(),
    )
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

      t.test('line item status update should be idempotent', (q) => {
        ordersUpdate.summary = {
          errors: [],
          inserted: [],
          successfullImports: 0,
        }
        const modifiedOrder = modifyOrder(order, channelKey)
        return ordersUpdate.processOrder(modifiedOrder)
          .then(orderx =>
            ordersUpdate.client.orders
              .where(`orderNumber="${orderx.orderNumber}"`).fetch(),
          )
          .then(({ body: { results: _orders } }) => {
            const _order = _orders[0]

            q.equal(
              _order.lineItems[0].state[0].quantity, 8999,
              'quantity of line item should not be modified',
            )

            q.equal(
              _order.lineItems[0].state[1].quantity, 2,
              'quantity of line item should not be modified',
            )

            q.equal(
              _order.customLineItems[0].state[0].quantity, 52,
              'quantity of custom line item should not be modified',
            )

            q.equal(
              _order.customLineItems[0].state[1].quantity, 48,
              'quantity of custom line item should not be modified',
            )
            q.end()
          })
      })
      t.end()
    })
    .catch((error) => {
      console.log(error)
      t.fail(error)
    })
})
