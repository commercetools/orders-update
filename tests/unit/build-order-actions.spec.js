import buildOrderActions from 'build-order-actions'
import test from 'tape'

import orderSample from '../helpers/order-sample.json'

test(`lineItems
  should build actions`, (t) => {
  const order = Object.assign(
    JSON.parse(JSON.stringify(orderSample)),
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
            actualTransitionDate: '2016-12-23T18:00:00.000Z',
          }],
        },
        {
          id: 'nalepa monday',
          state: [{
            quantity: 3,
            fromState: {
              typeId: 'state',
              id: 'wat',
            },
            toState: {
              typeId: 'state',
              id: 'patattekes',
            },
          }],
        },
      ],
    },
  )

  const actions = buildOrderActions.lineItems(order)

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
      {
        action: 'transitionLineItemState',
        lineItemId: 'nalepa monday',
        quantity: 3,
        fromState: {
          typeId: 'state',
          id: 'wat',
        },
        toState: {
          typeId: 'state',
          id: 'patattekes',
        },
      },
    ],
    'generated actions match expected data',
  )

  t.end()
})

test(`customLineItems
  should build actions`, (t) => {
  const order = Object.assign(
    JSON.parse(JSON.stringify(orderSample)),
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
            actualTransitionDate: '2016-12-23T18:00:00.000Z',
          }],
        },
        {
          id: 'pixels',
          state: [{
            quantity: 3,
            fromState: {
              typeId: 'state',
              id: 'tricksels',
            },
            toState: {
              typeId: 'state',
              id: 'kicksels',
            },
          }],
        },
      ],
    },
  )

  const actions = buildOrderActions.customLineItems(order)

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
      {
        action: 'transitionCustomLineItemState',
        customLineItemId: 'pixels',
        quantity: 3,
        fromState: {
          typeId: 'state',
          id: 'tricksels',
        },
        toState: {
          typeId: 'state',
          id: 'kicksels',
        },
      },
    ],
    'generated actions match expected data',
  )

  t.end()
})

test(`lineItems
  should ignore lineItems without a state`, (t) => {
  const order = Object.assign(
    JSON.parse(JSON.stringify(orderSample)),
    {
      lineItems: [{
        id: '123',
      }],
    },
  )

  const actions = buildOrderActions.lineItems(order)

  t.deepEqual(actions, [], 'no actions are generated')

  t.end()
})

test.skip('refactor!', (t) => {
  const order = {
    orderNumber: 'peanutbutter jelly',
    orderState: 'Open',
    totalPrice: {
      currencyCode: 'EUR',
      centAmount: 4200,
    },
    lineItems: [
      {
        name: {
          nl: 'piet',
        },
        variant: {
          sku: 'hobbes',
        },
        price: {
          value: {
            currencyCode: 'EUR',
            centAmount: 123,
          },
        },
        quantity: 9001,
        state: [
          {
            quantity: 9000,
            state: {
              typeId: 'state',
              id: '38b51321-3fdb-4e22-97cd-11df27bade8a',
            },
          },
          {
            quantity: 1,
            state: {
              typeId: 'state',
              id: '6e8bbf96-c1ef-49cf-af73-d04a5e496bbc',
            },
          },
        ],
        taxRate: {
          name: 'joe',
          amount: 99,
          includedInPrice: true,
          country: 'NL',
        },
      },
      {
        name: {
          nl: 'piet',
        },
        variant: {
          sku: 'hobbes',
        },
        price: {
          value: {
            currencyCode: 'EUR',
            centAmount: 123,
          },
        },
        quantity: 9001,
        state: [
          {
            quantity: 9000,
            fromState: {
              typeId: 'state',
              id: '38b51321-3fdb-4e22-97cd-11df27bade8a',
            },
            toState: {
              typeId: 'state',
              id: '38b51321-3fdb-4e22-97cd-11df27bade8a',
            },
          },
          {
            quantity: 1,
            state: {
              typeId: 'state',
              id: '6e8bbf96-c1ef-49cf-af73-d04a5e496bbc',
            },
          },
        ],
        taxRate: {
          name: 'joe',
          amount: 99,
          includedInPrice: true,
          country: 'NL',
        },
      },
      {
        name: {
          nl: 'piet',
        },
        variant: {
          sku: 'hobbes',
        },
        price: {
          value: {
            currencyCode: 'EUR',
            centAmount: 123,
          },
        },
        quantity: 9001,
      },
    ],
    returnInfo: [],
  }

  order.lineItems.reduce((prevLineItem, lineItem) => {
    console.log('prevLineItem', prevLineItem)
  }, [])

  t.true(true)

  t.end()
})
