import OrdersUpdate from 'orders-update'
import sinon from 'sinon'
import { SphereClient } from 'sphere-node-sdk'
import test from 'tape'

import buildOrderActions from '../../src/build-order-actions'

import orderSample from '../helpers/order-sample'

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
  newOrdersUpdate().validateOrderData(orderSample())
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
  sinon.stub(updater.client.channels, 'where', () => ({
    fetch: () => mockResult,
  }))

  sinon.stub(updater, 'buildUpdateActions', () => [true])

  const byIdStub = sinon.stub(updater.client.orders, 'byId', () => ({
    update: () => mockResult,
  }))

  updater.processOrder(orderSample()).then(() => {
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

  // Stub to 'skip' expandReferences
  sinon.stub(updater, 'expandReferences', order => order)

  const validateStub = sinon.stub(updater, 'validateOrderData')
  validateStub.returns(Promise.reject(new Error('validate kaboom')))
  validateStub.onCall(1).returns(Promise.resolve())

  updater.processOrder(orderSample())
    .catch(t.fail)

  sinon.stub(updater, 'updateOrder', () =>
    Promise.reject(new Error('update kaboom')))

  updater.processOrder(orderSample())
    .then(() => {
      t.equal(
        updater.summary.errors[0].error.message,
        'validate kaboom',
        'updater summary contains validate error',
      )
      t.equal(
        updater.summary.errors[1].error.message,
        'update kaboom',
        'updater summary contains update error',
      )
      t.equal(
        JSON.stringify(updater.summary.errors[0].error.message),
        '"validate kaboom"',
        'error is serialized to work with JSON.stringify',
      )
      t.end()
    })
    .catch(t.fail)
})

test(`updateOrder
  should not update order if no update actions`, (t) => {
  const updater = newOrdersUpdate()
  const _orderSample = orderSample()
  delete _orderSample.syncInfo
  sinon.stub(updater.client.orders, 'where', () => ({
    fetch: () => Promise.resolve({
      body: {
        total: 1,
        results: [{
          id: 'ageart3raefaetq4raefa',
          shippingInfo: {
            deliveries: [],
          },
        }],
      },
    }),
  }))
  const stub = sinon.stub(updater.client.orders, 'byId')
  updater.updateOrder(_orderSample)
    .then((order) => {
      t.deepEqual(order, _orderSample, 'Order object is return')
      t.false(stub.called, 'fetch client by id method is not called')
      t.end()
    })
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

  updater.updateOrder(orderSample())
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

test(`getReferenceFromKey
  should fetch state and return reference type and state id`, (t) => {
  const updater = newOrdersUpdate()
  const mockData = { id: '53 65 6c 77 79 6e' }
  const mockResult = Promise.resolve({
    body: {
      total: 1,
      results: [mockData],
    },
  })

  sinon.stub(updater.client.states, 'where', () => ({
    fetch: () => mockResult,
  }))

  updater.getReferenceFromKey('testState', 'state', 'states').then((result) => {
    t.equal(
      result.typeId,
      'state',
      'reference type \'state\' is added to result',
    )
    t.ok(result.id, 'State Id is added to result')
    t.end()
  })
})

test(`getReferenceFromKey
  should return if no result is returned`, (t) => {
  const updater = newOrdersUpdate()
  const mockResult = Promise.resolve({
    body: {
      total: 0,
      count: 0,
      results: [],
    },
  })

  sinon.stub(updater.client.states, 'where', () => ({
    fetch: () => mockResult,
  }))

  updater.getReferenceFromKey('testState', 'state', 'states')
    .then(t.fail)
    .catch((error) => {
      t.equal(
        error.message,
        'Didn\'t find any match while resolving testState from the API',
        'Error message is descriptive',
      )
      t.end()
    })
})

test(`getReferenceFromKey
  should fetch channel and return reference type and state id`, (t) => {
  const updater = newOrdersUpdate()
  const mockData = { id: '277a3b20-8b31-4764-98ec-2fc720a98ba2' }
  const mockResult = Promise.resolve({
    body: {
      total: 1,
      results: [mockData],
    },
  })

  sinon.stub(updater.client.channels, 'where', () => ({
    fetch: () => mockResult,
  }))

  updater.getReferenceFromKey('testChannel', 'channel', 'channels')
    .then((result) => {
      t.equal(
        result.typeId,
        'channel',
        'reference type \'channel\' is added to result',
      )
      t.ok(result.id, 'channel Id is added to result')
      t.end()
    })
})

test(`getReference
  should ignore if channel field is an object`, (t) => {
  const updater = newOrdersUpdate()
  const stub = sinon.stub(updater.client.channels, 'where')
  const mockChannel = {
    typeId: 'channel',
    id: '277a3b20-8b31-4764-98ec-2fc720a98ba2',
  }

  updater.getReference(mockChannel, 'channel', 'channels').then((result) => {
    t.false(stub.called, 'fetch channels method is not called')
    t.deepEqual(
      result,
      mockChannel,
      'channel object passed in is returned',
    )
    t.end()
  })
})

test(`getReferenceFromKey
  should return if no result is returned`, (t) => {
  const updater = newOrdersUpdate()
  const mockResult = Promise.resolve({
    body: {
      total: 0,
      count: 0,
      results: [],
    },
  })

  sinon.stub(updater.client.channels, 'where', () => ({
    fetch: () => mockResult,
  }))

  updater.getReferenceFromKey('testChannel', 'channel', 'channels')
    .then(t.fail)
    .catch((error) => {
      t.equal(
        error.message,
        'Didn\'t find any match while resolving testChannel from the API',
        'Error message is descriptive',
      )
      t.end()
    })
})

test(`expandReferences
  should fill in missing required fields with empty array because\
  it's not possible to map on an 'undefined' field`, (t) => {
  const updater = newOrdersUpdate()
  updater.expandReferences({}).then((result) => {
    t.deepEqual(
      result,
      { customLineItems: [], lineItems: [], syncInfo: [] },
      'Required arguments are filled in',
    )
    t.end()
  })
})

test(`expandReferences
  should resolve lineItems, customLineItems and syncInfo reference`, (t) => {
  const updater = newOrdersUpdate()
  const mockOrder = {
    orderNumber: 'peanutbutter jelly',
    lineItems: [{
      state: [{
        fromState: 'hey',
        toState: 'ho',
      }],
    }],
    customLineItems: [{
      state: [{
        fromState: 'foo',
        toState: 'bar',
      }],
    }],
    syncInfo: [{
      channel: 'testChannel',
    }],
  }

  const getReferenceFromKeyStub = sinon.stub(updater, 'getReferenceFromKey')

  const channelResult = {
    typeId: 'channel',
    id: '277a3b20-8b31-4764-98ec-2fc720a98ba2',
  }
  getReferenceFromKeyStub
    .withArgs(mockOrder.syncInfo[0].channel, 'channel', 'channels')
    .returns(channelResult)

  const stateResult = {
    typeId: 'state',
    id: '53 65 6c 77 79 6e',
  }
  getReferenceFromKeyStub
    .returns(stateResult)

  updater.expandReferences(mockOrder).then((result) => {
    t.equal(
      getReferenceFromKeyStub.callCount,
      5,
      'getReferenceFromKey was called for each reference',
    )
    t.deepEqual(
      getReferenceFromKeyStub.args,
      [
        [ 'testChannel', 'channel', 'channels' ],
        [ 'hey', 'state', 'states' ],
        [ 'ho', 'state', 'states' ],
        [ 'foo', 'state', 'states'],
        [ 'bar', 'state', 'states'],
      ],
      'getReferenceFromKey is called with the right arguments',
    )
    t.deepEqual(
      result.syncInfo[0].channel,
      channelResult,
      'Channel reference object is returned',
    )
    t.deepEqual(
      result.lineItems[0].state[0].fromState,
      stateResult,
      'Channel reference object is returned for lineItem',
    )
    t.deepEqual(
      result.lineItems[0].state[0].toState,
      stateResult,
      'Channel reference object is returned for lineItem',
    )
    t.deepEqual(
      result.lineItems[0].state[0].fromState,
      stateResult,
      'Channel reference object is returned for customLineItem',
    )
    t.deepEqual(
      result.lineItems[0].state[0].toState,
      stateResult,
      'Channel reference object is returned for customLineItem',
    )

    t.end()
  })
})
