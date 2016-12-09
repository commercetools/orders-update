import OrdersUpdate from 'index'
import sinon from 'sinon'
import { SphereClient } from 'sphere-node-sdk'
import test from 'tape'

import orderSample from '../helpers/order-sample.json'

const PROJECT_KEY =
  process.env.CT_PROJECT_KEY || process.env.npm_config_projectkey

const apiClientConfig = {
  config: {
    project_key: PROJECT_KEY,
    client_id: '*********',
    client_secret: '*********',
  },
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

test(`summaryReport
  should contain no errors and no imports if nothing is imported`, (t) => {
  const importer = new OrdersUpdate(apiClientConfig)
  const expected = { errors: [], inserted: [], successfullImports: 0 }
  const actual = JSON.parse(importer.summaryReport())

  t.deepEqual(actual, expected, 'No errors if no import occurs')

  t.end()
})

test(`validateOrderData
  should resolve if the order data is valid`, (t) => {
  const importer = new OrdersUpdate(apiClientConfig)
  importer.validateOrderData(orderSample)
    .then(() => t.end())
    .catch(t.fail)
})

test(`validateOrderData
  should reject if the order data is invalid`, (t) => {
  const importer = new OrdersUpdate(apiClientConfig)
  importer.validateOrderData({ id: {} })
    .then(t.fail)
    .catch(() => t.end())
})

test(`processStream
  should exist, needed for compatibility with the CLI`, (t) => {
  const importer = new OrdersUpdate(apiClientConfig)

  t.true(importer.processStream)
  t.end()
})

test(`processStream
  should call processOrder for each order in the given chunk`, (t) => {
  const mockProcessOrder = sinon.spy(() => {})
  const callback = () => {}
  const orders = Array.from(new Array(10), () => ({ id: 'heya' }))
  const importer = new OrdersUpdate(apiClientConfig)
  sinon.stub(importer, 'processOrder', mockProcessOrder)

  importer.processStream(orders, callback)
    .then(() => {
      t.equal(
        mockProcessOrder.callCount, orders.length,
        'processOrder gets called for each order'
      )

      t.end()
    })
})

test(`processOrder
  should push error to summary when error occurs`, (t) => {
  const importer = new OrdersUpdate(apiClientConfig)

  const validateStub = sinon.stub(importer, 'validateOrderData')
  validateStub.returns(Promise.reject('validate kaboom'))
  validateStub.onCall(1).returns(Promise.resolve())

  importer.processOrder(orderSample)
    .catch(t.fail)

  sinon.stub(importer, 'updateOrder', () => Promise.reject('update kaboom'))

  importer.processOrder(orderSample)
    .then(() => {
      t.equal(
        importer.summary.errors[0].error, 'validate kaboom',
        'importer summary contains validate error'
      )
      t.equal(
        importer.summary.errors[1].error, 'update kaboom',
        'importer summary contains update error'
      )
      t.end()
    })
    .catch(t.fail)
})

test(`updateOrder
  should update an existing order`, (t) => {
  const importer = new OrdersUpdate(apiClientConfig)
  const mockData = { id: '53 65 6c 77 79 6e' }

  sinon.stub(importer.client.orders, 'where', () => ({
    fetch: () => Promise.resolve({
      body: {
        total: 1,
        results: [mockData],
      },
    }),
  }))

  const byIdStub = sinon.stub(importer.client.orders, 'byId', () => ({
    update: () => Promise.resolve(),
  }))

  importer.updateOrder(orderSample).then(() => {
    t.equal(
      importer.summary.successfullImports, 1,
      'one order should be imported successfully'
    )

    t.equal(
      byIdStub.args[0][0], mockData.id,
      'should call API with order ID to update'
    )

    t.end()
  })
  .catch(t.fail)
})

test(`updateOrder
  should ignore an identical existing order`, (t) => {
  const importer = new OrdersUpdate(apiClientConfig)

  sinon.stub(importer.client.orders, 'where', () => ({
    fetch: () => Promise.resolve({
      body: {
        total: 1,
        results: [orderSample],
      },
    }),
  }))

  const byIdStub = sinon.stub(importer.client.orders, 'byId', () => ({
    update: () => Promise.resolve(),
  }))

  importer.updateOrder(orderSample).then(() => {
    t.equal(
      importer.summary.successfullImports, 1,
      'one order should be imported successfully'
    )

    t.false(byIdStub.called, 'no call to the API should be made')

    t.end()
  })
  .catch(t.fail)
})

test(`updateOrder
  should handle missing order`, (t) => {
  const importer = new OrdersUpdate(apiClientConfig)

  sinon.stub(importer.client.orders, 'where', () => ({
    fetch: () => Promise.resolve({
      body: {
        total: 0,
      },
    }),
  }))

  importer.updateOrder(orderSample)
    .then(t.fail)
    .catch((error) => {
      t.true(
        String(error).match(/not found/),
        'return error with not found message'
      )
      t.end()
    })
})
