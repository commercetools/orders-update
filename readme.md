[![commercetools logo][commercetools-icon]][commercetools]

# Orders Update
[![Travis Build Status][travis-icon]][travis]
[![Codecov Coverage Status][codecov-icon]][codecov]
[![David Dependencies Status][david-icon]][david]
[![David devDependencies Status][david-dev-icon]][david-dev]

A library that helps with updating [orders](https://dev.commercetools.com/http-api-projects-orders.html) into the [commercetools] platform.

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
Then you can use this file using the cli:
```
sphere-node-cli -t order -p my-project-key -f ./orders.json
```

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
    project_key: '',
    client_id: '',
    client_secret: '',
});

ordersUpdate.processOrder(fs.readFileSync('./input.json'))
  .then(() => {
    // look at the summary to see errors
    console.log(ordersUpdate.summary);

    // {
    //   errors: [...],
    //   inserted: [...],
    //   successfulImports: 1
    // }
  });
```

## Configuration
`OrdersUpdate` accepts one object as an argument:
- API client config (_required_)
  - See the [SDK documentation](http://sphereio.github.io/sphere-node-sdk/classes/SphereClient.html) for more information.

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
