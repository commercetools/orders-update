[![commercetools logo][commercetools-icon]][commercetools]

# Orders Update
[![Travis Build Status][travis-icon]][travis]
[![Codecov Coverage Status][codecov-icon]][codecov]
[![David Dependencies Status][david-icon]][david]
[![David devDependencies Status][david-dev-icon]][david-dev]

A library that helps with updating [orders](https://dev.commercetools.com/http-api-projects-orders.html) into the [commercetools] platform.

## Supported order fields
- customLineItems
- lineItems
- syncInfo
- returnInfo
- shippingInfo.deliveries

## Usage

### CLI

You can use the orders update from the command line using [`sphere-node-cli`](https://github.com/sphereio/sphere-node-cli).
In order for the CLI to update orders, the file to update from must be JSON and follow the this structure:
```
{
  "orders": [
    <order>,
    <order>,
    ...
  ]
}
```

To update lineItems/customLineItems status the order object have to follow this format
```
{
  orderNumber: 1234567,
  lineItems: [{
    state: [{
      fromState: 'statekey',
      toState: 'statekey',
      quantity: 20, // The number of quantity you want to migrate from the a state to another.
      _fromStateQty: 100 // The quantity in the 'fromState' before the update. More information about why this is necessary [here](https://github.com/commercetools/orders-update/issues/11)
    }]
  }]
}

```
Then you can use this file using the cli:
```
sphere-node-cli -t order -p my-project-key -f ./orders.json
```

When updating `returnInfo`, all items are compared against existing return info items. If there is a matching returnInfo item (matched by keys `returnTrackingId` and `returnDate`) script goes through returnItems and sets new `shipmentState` or `paymentState` if they differ from old values. If returnInfo item is not found it is inserted as a new item. 
### Direct usage

If you want more control, you can also use this library directly in JavaScript. To do this you first need to install it:
```
npm install @commercetools/orders-update --save
```
Then you can use it to update an order like so:
```
const fs = require('fs');
const OrdersUpdate = require('orders-update');

const ordersUpdate = new OrdersUpdate({
  config: {
    project_key: '',
    client_id: '',
    client_secret: '',
  },
});

const orderData = JSON.parse(fs.readFileSync('order.json'));

ordersUpdate.processOrder(orderData)
  .then(() => {
    // look at the summary
    console.info(ordersUpdate.summary);

    // {
    //   errors: [...],
    //   inserted: [...],
    //   successfulImports: 1
    // }
  })
  .catch(console.error);
```

## Configuration
`OrdersUpdate` accepts one object as an argument:
- API client config (_required_)
  - See the [SDK documentation](http://sphereio.github.io/sphere-node-sdk/classes/SphereClient.html) for more information.
- Logger takes object with four functions (_optional_)
  - error
  - warn
  - info
  - verbose

## Contributing
See [contributing.md](contributing.md) for info on contributing.

[commercetools]: https://commercetools.com/
[commercetools-icon]: https://cdn.rawgit.com/commercetools/press-kit/master/PNG/72DPI/CT%20logo%20horizontal%20RGB%2072dpi.png
[travis]: https://travis-ci.org/commercetools/orders-update
[travis-icon]: https://img.shields.io/travis/commercetools/orders-update/master.svg?style=flat-square
[codecov]: https://codecov.io/gh/commercetools/orders-update
[codecov-icon]: https://img.shields.io/codecov/c/github/commercetools/orders-update.svg?style=flat-square
[david]: https://david-dm.org/commercetools/orders-update
[david-icon]: https://img.shields.io/david/commercetools/orders-update.svg?style=flat-square
[david-dev]: https://david-dm.org/commercetools/orders-update?type=dev
[david-dev-icon]: https://img.shields.io/david/dev/commercetools/orders-update.svg?style=flat-square
