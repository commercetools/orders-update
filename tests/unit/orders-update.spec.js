import OrdersUpdate from 'orders-update'
import sinon from 'sinon'
import { SphereClient } from 'sphere-node-sdk'
import test from 'tape'

import buildOrderActions from '../../src/build-order-actions'

import orderSample from '../helpers/order-sample.json'

const PROJECT_KEY =
  process.env.CT_PROJECT_KEY || process.env.npm_config_projectkey

const newOrdersUpdate = () => new OrdersUpdate(
  {
    config: {
      project_key: PROJECT_KEY,
      client_id: '*********',
      client_secret: '*********',
    },
  },
  {
    error: () => {},
    warn: () => {},
    info: () => {},
    verbose: () => {},
  },
  )

test(`OrdersUpdate
  should be an instance`, (t) => {
  t.equal(typeof OrdersUpdate, 'function', 'OrdersUpdate is a class')

  t.end()
})

test(`OrdersUpdate
  should create a sphere client`, (t) => {
  const client = newOrdersUpdate().client

  t.true(
    client instanceof SphereClient,
    'OrdersUpdate is an instanceof SphereClient',
  )
  t.end()
})

test(`summaryReport
  should contain no errors and no imports if nothing is imported`, (t) => {
  const expected = { errors: [], inserted: [], successfullImports: 0 }
  const actual = JSON.parse(newOrdersUpdate().summaryReport())

  t.deepEqual(actual, expected, 'No errors if no import occurs')

  t.end()
})

test(`validateOrderData
  should resolve if the order data is valid`, (t) => {
  newOrdersUpdate().validateOrderData(orderSample)
    .then(() => t.end())
    .catch(t.fail)
})

test(`validateOrderData
  should reject if the order data is invalid`, (t) => {
  newOrdersUpdate().validateOrderData({ id: true })
    .then(t.fail)
    .catch((errors) => {
      t.true(errors[0])
      t.equal(
        errors[0].message,
        'should be string',
        'should return error about ID\'s type',
      )
      t.end()
    })
})

test(`processStream
  should exist, needed for compatibility with the CLI`, (t) => {
  t.true(newOrdersUpdate().processStream)
  t.end()
})

test(`processStream
  should call processOrder for each order in the given chunk`, (t) => {
  const orders = Array.from(new Array(10), () => ({ id: 'heya' }))
  const updater = newOrdersUpdate()
  const processOrderStub = sinon.stub(updater, 'processOrder')

  updater.processStream(orders, () => {})
    .then(() => {
      t.equal(
        processOrderStub.callCount,
        orders.length,
        'processOrder gets called for each order',
      )

      t.end()
    })
})

test(`processOrder
  should update an existing order`, (t) => {
  const updater = newOrdersUpdate()
  const mockData = { id: '53 65 6c 77 79 6e' }
  const mockResult = Promise.resolve({
    body: {
      total: 1,
      results: [mockData],
    },
  })

  // Stub calls to the API
  sinon.stub(updater.client.orders, 'where', () => ({
    fetch: () => mockResult,
  }))
  sinon.stub(updater.client.states, 'where', () => ({
    fetch: () => mockResult,
  }))

  sinon.stub(updater, 'buildUpdateActions', () => [true])

  const byIdStub = sinon.stub(updater.client.orders, 'byId', () => ({
    update: () => mockResult,
  }))

  updater.processOrder(orderSample).then(() => {
    t.equal(
      updater.summary.successfullImports, 1,
      'one order should be imported successfully',
    )
    t.deepEqual(
      updater.summary.errors, [],
      'no errors are reported',
    )
    t.equal(
      byIdStub.args[0][0], mockData.id,
      'should call API with order ID to update',
    )

    t.end()
  })
  .catch(t.fail)
})

test(`processOrder
  should push error to summary when error occurs`, (t) => {
  const updater = newOrdersUpdate()

  // Stub to 'skip' getReferences
  sinon.stub(updater, 'getReferences', (order) => order)

  const validateStub = sinon.stub(updater, 'validateOrderData')
  validateStub.returns(Promise.reject('validate kaboom'))
  validateStub.onCall(1).returns(Promise.resolve())

  updater.processOrder(orderSample)
    .catch(t.fail)

  sinon.stub(updater, 'updateOrder', () => Promise.reject('update kaboom'))

  updater.processOrder(orderSample)
    .then(() => {
      t.equal(
        updater.summary.errors[0].error, 'validate kaboom',
        'updater summary contains validate error',
      )
      t.equal(
        updater.summary.errors[1].error, 'update kaboom',
        'updater summary contains update error',
      )
      t.end()
    })
    .catch(t.fail)
})

test(`updateOrder
  should ignore an identical existing order`, (t) => {
  const updater = newOrdersUpdate()

  sinon.stub(updater.client.orders, 'where', () => ({
    fetch: () => Promise.resolve({
      body: {
        total: 1,
        results: [orderSample],
      },
    }),
  }))

  const byIdStub = sinon.stub(updater.client.orders, 'byId', () => ({
    update: () => Promise.resolve(),
  }))

  updater.updateOrder(orderSample).then(() => {
    t.false(byIdStub.called, 'no call to the API should be made')

    t.end()
  })
  .catch(t.fail)
})

test(`updateOrder
  should handle missing order`, (t) => {
  const updater = newOrdersUpdate()

  sinon.stub(updater.client.orders, 'where', () => ({
    fetch: () => Promise.resolve({
      body: {
        total: 0,
      },
    }),
  }))

  updater.updateOrder(orderSample)
    .then(t.fail)
    .catch((error) => {
      t.true(
        String(error).match(/not found/),
        'return error with not found message',
      )
      t.end()
    })
})

test(`buildUpdateActions
  should ignore fields without a action building function`, (t) => {
  const actions = newOrdersUpdate().buildUpdateActions({ noop: true })

  t.deepEqual(actions, [], 'no actions are generated')

  t.end()
})

test(`buildUpdateActions
  should call build action functions with the field name`, (t) => {
  const buildOrderActionsStub =
    sinon.stub(buildOrderActions, 'lineItems', () => [])

  newOrdersUpdate().buildUpdateActions({ lineItems: [] })

  t.equal(buildOrderActionsStub.callCount, 1)

  t.end()
})
