import buildOrderActions from 'build-order-actions'
import test from 'tape'

import orderSample from '../helpers/order-sample'

test(`syncInfo
  should build actions`, (t) => {
  const order = Object.assign(
    {},
    orderSample(),
    {
      syncInfo: [
        {
          channel: {
            typeId: 'channel',
            id: 'd1229e6f-2b79-441e-b419-180311e52123',
          },
          syncedAt: '2001-09-11T14:00:00.000Z',
        },
        {
          channel: {
            typeId: 'channel',
            id: 'd1229e6f-2b79-441e-b419-180311e52754',
          },
          externalId: 'dhl',
        },
        {
          channel: {
            typeId: 'channel',
            id: 'd1229e6f-2b79-441e-b419-180311e52754',
          },
          externalId: 'ctp',
          syncedAt: '2001-09-11T14:00:00.000Z',
        },
      ],
    },
  )

  const actions = buildOrderActions.syncInfo(order)

  t.deepEqual(
    actions,
    [
      {
        action: 'updateSyncInfo',
        channel: {
          typeId: 'channel',
          id: 'd1229e6f-2b79-441e-b419-180311e52123',
        },
        syncedAt: '2001-09-11T14:00:00.000Z',
      },
      {
        action: 'updateSyncInfo',
        channel: {
          typeId: 'channel',
          id: 'd1229e6f-2b79-441e-b419-180311e52754',
        },
        externalId: 'dhl',
      },
      {
        action: 'updateSyncInfo',
        channel: {
          typeId: 'channel',
          id: 'd1229e6f-2b79-441e-b419-180311e52754',
        },
        externalId: 'ctp',
        syncedAt: '2001-09-11T14:00:00.000Z',
      },
    ],
    'generated actions match expected data',
  )

  t.end()
})

test(`buildOrderActions
  should build lineItems actions`, (t) => {
  const order = Object.assign(
    {},
    orderSample(),
    {
      lineItems: [
        {
          id: 'the glitch mob',
          state: [{
            quantity: 1,
            fromState: {
              typeId: 'state',
              id: '73;65;6c;77;79;6e',
            },
            toState: {
              typeId: 'state',
              id: 'other',
            },
            _fromStateQty: 9000,
            actualTransitionDate: '2016-12-23T18:00:00.000Z',
          }],
        },
      ],
    },
  )

  const actions = buildOrderActions.lineItems(order, orderSample())

  t.deepEqual(
    actions,
    [
      {
        action: 'transitionLineItemState',
        lineItemId: 'the glitch mob',
        quantity: 1,
        fromState: {
          typeId: 'state',
          id: '73;65;6c;77;79;6e',
        },
        toState: {
          typeId: 'state',
          id: 'other',
        },
        actualTransitionDate: '2016-12-23T18:00:00.000Z',
      },
    ],
    'generated actions match expected data',
  )

  t.end()
})

test(`buildOrderActions
  should detect line items duplicates and not build actions`, (t) => {
  const order = Object.assign(
    orderSample(),
    {
      lineItems: [
        {
          id: 'the glitch mob',
          state: [{
            quantity: 100,
            fromState: {
              typeId: 'state',
              id: '73;65;6c;77;79;6e',
            },
            toState: {
              typeId: 'state',
              id: 'other',
            },
            _fromStateQty: 6000,
            actualTransitionDate: '2016-12-23T18:00:00.000Z',
          }],
        },
      ],
    },
  )

  const existingOrder = orderSample()
  const actions = buildOrderActions.lineItems(order, existingOrder)
  const expectedActions = []
  t.deepEqual(
    actions,
    expectedActions,
    'No actions is generated',
  )

  t.end()
})

test(`buildOrderActions
  should ignore lineItems without a state`, (t) => {
  const order = Object.assign(
    {},
    orderSample(),
    {
      lineItems: [{
        id: '123',
      }],
    },
  )

  const actions = buildOrderActions.lineItems(order, orderSample())
  t.deepEqual(actions, [], 'no actions are generated')

  t.end()
})
test(`buildOrderActions
  should ignore lineItems without a fromState or toState`, (t) => {
  const order = Object.assign(
    {},
    orderSample(),
    {
      lineItems: [{
        id: '123',
        state: [],
      }],
    },
  )

  const actions = buildOrderActions.lineItems(order, orderSample())
  t.deepEqual(actions, [], 'no actions are generated')

  t.end()
})

test(`buildOrderActions
  should build customLineItems actions`, (t) => {
  const order = Object.assign(
    {},
    orderSample(),
    {
      customLineItems: [
        {
          id: 'aloha',
          state: [{
            quantity: 1,
            fromState: {
              typeId: 'state',
              id: 'melodymania',
            },
            toState: {
              typeId: 'state',
              id: 'crocodile',
            },
            _fromStateQty: 55,
            actualTransitionDate: '2016-12-23T18:00:00.000Z',
          }],
        },
        {
          id: 'trixels',
          state: [{
            quantity: 3,
          }],
        },
      ],
    },
  )

  const actions = buildOrderActions.customLineItems(order, orderSample())

  t.deepEqual(
    actions,
    [
      {
        action: 'transitionCustomLineItemState',
        customLineItemId: 'aloha',
        quantity: 1,
        fromState: {
          typeId: 'state',
          id: 'melodymania',
        },
        toState: {
          typeId: 'state',
          id: 'crocodile',
        },
        actualTransitionDate: '2016-12-23T18:00:00.000Z',
      },
    ],
    'generated actions match expected data',
  )

  t.end()
})

test(`buildOrderActions
  should ignore customLineItems without a state`, (t) => {
  const order = Object.assign(
    {},
    orderSample(),
    {
      customLineItems: [{
        id: '123',
      }],
    },
  )

  const actions = buildOrderActions.customLineItems(order, orderSample())

  t.deepEqual(actions, [], 'no actions are generated')

  t.end()
})

test(`buildOrderActions::checkIffromStateQtytally
  should return true if fromStateQty equal quantity
  in exisiting order`, (t) => {
  const order = orderSample()
  const actual = buildOrderActions.checkIffromStateQtytally(
    order,
    '73;65;6c;77;79;6e',
    9000,
    'lineItems',
  )
  const expected = true
  const message = 'qty in fromState tallies with the qty passed in'
  t.equal(actual, expected, message)
  t.end()
})

test(`buildOrderActions::checkIffromStateQtytally
  should return false if fromStateQty differs from quantity
  in exisiting order`, (t) => {
  const order = orderSample()
  const actual = buildOrderActions.checkIffromStateQtytally(
    order,
    '73;65;6c;77;79;6e',
    7000,
    'lineItems',
  )
  const expected = false
  const message = 'qty in fromState does not tally with the qty passed in'
  t.equal(actual, expected, message)
  t.end()
})
