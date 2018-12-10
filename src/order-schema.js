module.exports = {
  type: 'object',
  properties: {
    id: {
      type: 'string',
    },
    version: {
      type: 'number',
    },
    createdAt: {
      type: 'string',
    },
    lastModifiedAt: {
      type: 'string',
    },
    completedAt: {
      type: 'string',
    },
    orderNumber: {
      type: 'string',
    },
    customerId: {
      type: 'string',
    },
    customerEmail: {
      type: 'string',
    },
    anonymousId: {
      type: 'string',
    },
    lineItems: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            minLength: 1,
          },
        },
      },
    },
    customLineItems: {
      type: 'array',
      items: {
        type: 'object',
      },
    },
    totalPrice: {
      type: 'object',
      items: {
        type: 'string',
      },
    },
    taxedPrice: {
      type: 'object',
      items: {
        type: 'object',
      },
    },
    shippingAddress: {
      type: 'string',
    },
    billingAddress: {
      type: 'string',
    },
    taxMode: {
      type: 'string',
    },
    customerGroup: {
      type: 'object',
      items: {
        type: 'string',
      },
    },
    country: {
      type: 'string',
    },
    orderState: {
      type: 'string',
    },
    state: {
      type: 'object',
      items: {
        type: 'string',
      },
    },
    shipmentState: {
      type: 'string',
    },
    paymentState: {
      type: 'string',
    },
    shippingInfo: {
      type: 'object',
    },
    syncInfo: {
      type: 'array',
    },
    returnInfo: {
      type: 'array',
    },
    discountCodes: {
      type: 'array',
    },
    lastMessageSequenceNumber: {
      type: 'number',
    },
    cart: {
      type: 'object',
    },
    custom: {
      type: 'object',
    },
    paymentInfo: {
      type: 'object',
    },
    locale: {
      type: 'string',
    },
    inventoryMode: {
      type: 'string',
    },
  },
  required: [
    'orderNumber',
  ],
  additionalProperties: false,
}
