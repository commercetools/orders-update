export default function () {
  return {
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
              id: '',
            },
          },
          {
            quantity: 1,
            state: {
              typeId: 'state',
              id: '',
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
    ],
    returnInfo: [],
    syncInfo: [
      {
        channel: 'testChannel',
      },
    ],
  }
}
