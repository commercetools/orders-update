import test from 'tape'

import { setup, modifyOrder, initOrderUpdate } from './utils.spec'

const PROJECT_KEY =
  process.env.CT_PROJECT_KEY || process.env.npm_config_projectkey

const endpoints = [
  'orders', 'products', 'productTypes',
  'states', 'shippingMethods', 'taxCategories',
]
const channelKey = 'OrderCsvFileExport'
const channelRole = 'OrderExport'

test('the module should modify an existing order', (t) => {
  let ordersUpdate
  const params = {
    projectKey: PROJECT_KEY,
    endpoints,
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
      console.error(error)
      t.fail(error)
    })
})


test('the module should not modify an order without changes', (t) => {
  let ordersUpdate
  let initialOrder
  const params = {
    projectKey: PROJECT_KEY,
    endpoints,
    channel: {
      key: channelKey,
      role: channelRole,
    },
  }

  setup(params)
  // Send data without changes to module
    .then(orderResult =>
      initOrderUpdate(PROJECT_KEY)
        .then((_ordersUpdate) => {
          ordersUpdate = _ordersUpdate
          initialOrder = orderResult.body

          return ordersUpdate.processOrder(initialOrder)
        }),
    )
    .then((order) => {
      t.deepEqual(order, initialOrder, 'order should not be modified')

      return ordersUpdate.client.orders
        .where(`orderNumber="${order.orderNumber}"`)
        .fetch()
    })
    // Check if data is modified as expected
    .then(({ body: { results: orders } }) => {
      const order = orders[0]
      t.equal(
        order.version, initialOrder.version,
        'order should have an old version')
      t.end()
    })
    .catch((error) => {
      console.error(error)
      t.fail(error)
    })
})

test('the module should update return info', (t) => {
  let ordersUpdate
  const params = {
    projectKey: PROJECT_KEY,
    endpoints,
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
          const modifiedOrder = Object.assign({}, orderResult.body)

          modifiedOrder.returnInfo.push({
            items: [{
              quantity: 100,
              lineItemId: modifiedOrder.lineItems[0].id,
              shipmentState: 'Returned',
              paymentState: 'Initial',
              comment: 'returned 1',
            },
            {
              quantity: 50,
              lineItemId: modifiedOrder.lineItems[0].id,
              shipmentState: 'Returned',
              comment: 'returned 1.2',
            }],
            returnTrackingId: 'trackingId',
            returnDate: '2017-02-11T14:00:00.000Z',
          })

          modifiedOrder.returnInfo.push({
            items: [{
              quantity: 200,
              lineItemId: modifiedOrder.lineItems[0].id,
              shipmentState: 'Returned',
              comment: 'returned 2',
            }],
            returnTrackingId: 'trackingId2',
            returnDate: '2017-02-11T14:00:00.000Z',
          })

          return ordersUpdate.processOrder(modifiedOrder)
        }),
    )
    .then((orderResult) => {
      const modifiedOrder = Object.assign({}, orderResult)

      modifiedOrder.returnInfo[0].items[0].shipmentState = 'BackInStock'
      modifiedOrder.returnInfo[0].items[0].paymentState = 'Refunded'
      modifiedOrder.returnInfo[0].items[1].shipmentState = 'Unusable'
      modifiedOrder.returnInfo[0].items[1].paymentState = 'NotRefunded'

      modifiedOrder.returnInfo[1].items[0].shipmentState = 'Unusable'
      modifiedOrder.returnInfo[1].items[0].paymentState = 'NotRefunded'

      modifiedOrder.returnInfo.push({
        items: [{
          quantity: 100,
          lineItemId: modifiedOrder.lineItems[0].id,
          shipmentState: 'Advised',
          comment: 'returned 3',
        }],
        returnTrackingId: 'trackingId3',
        returnDate: '2017-04-11T14:00:00.000Z',
      })

      return ordersUpdate.processOrder(modifiedOrder)
    })
    .then(order =>
      ordersUpdate.client.orders
        .where(`orderNumber="${order.orderNumber}"`)
        .fetch(),
    )
    // Check if data is modified as expected
    .then(({ body: { results: orders } }) => {
      const returnInfos = orders[0].returnInfo
      let returnInfo

      t.equal(returnInfos.length, 3, 'returnInfos should have 3 items')

      // ===== 1. returnInfo =====
      returnInfo = returnInfos[0]
      t.equal(returnInfo.returnTrackingId, 'trackingId',
        'returnInfo should have correct trackingId')

      t.equal(returnInfo.items.length, 2, 'returnInfo should have 2 items')

      t.equal(returnInfo.items[0].shipmentState, 'BackInStock',
        'returnItem.shipmentState should be modified')

      t.equal(returnInfo.items[1].shipmentState, 'Unusable',
        'returnItem.shipmentState should be modified')

      t.equal(returnInfo.items[0].paymentState, 'Refunded',
        'returnItem.paymentState should be modified')

      t.equal(returnInfo.items[1].paymentState, 'NotRefunded',
        'returnItem.paymentState should be modified')

      // ===== 2. returnInfo =====
      returnInfo = returnInfos[1]
      t.equal(returnInfo.returnTrackingId, 'trackingId2',
        'returnInfo should have correct trackingId')

      t.equal(returnInfo.items[0].shipmentState, 'Unusable',
        'returnItem.shipmentState should be modified')

      t.equal(returnInfo.items[0].paymentState, 'NotRefunded',
        'returnItem.paymentState should be modified')

      // ===== 3. returnInfo =====
      returnInfo = returnInfos[2]
      t.equal(returnInfo.returnTrackingId, 'trackingId3',
        'returnInfo should have correct trackingId')

      t.equal(returnInfo.items[0].shipmentState, 'Advised',
        'returnItem.shipmentState should be set to advised')

      t.equal(returnInfo.items[0].paymentState, 'NonRefundable',
        'returnItem.paymentState should have a default value')

      t.end()
    })
    .catch((error) => {
      console.error(error)
      t.fail(error)
    })
})

test('the module should update deliveries', (t) => {
  let orderUpdater
  const params = {
    projectKey: PROJECT_KEY,
    endpoints,
    channel: {
      key: channelKey,
      role: channelRole,
    },
  }

  setup(params)
  // Modify data and send to module
    .then(order =>
      initOrderUpdate(PROJECT_KEY)
        .then(_orderUpdater => (orderUpdater = _orderUpdater))
        .return(order),
    )
    .then((order) => {
      const modifiedOrder = Object.assign({}, order.body)

      modifiedOrder.shippingInfo.deliveries.push({
        items: [{
          id: modifiedOrder.lineItems[0].id,
          quantity: modifiedOrder.lineItems[0].quantity,
        }],
        parcels: [{
          trackingData: {
            trackingId: '447883009643',
            carrier: 'dhl',
            isReturn: false,
          },
        }],
      })

      return orderUpdater.processOrder(modifiedOrder)
    })
    .then((orderResult) => {
      const shippingInfo = orderResult.shippingInfo

      t.equal(shippingInfo.deliveries.length, 1,
        'deliveries should have one item')
      t.equal(shippingInfo.deliveries[0].parcels[0].trackingData.carrier, 'dhl',
        'deliveries should have dhl parcel')
      t.end()
    })
    .catch((error) => {
      t.fail(error)
    })
})
