import getApiCredentials from 'get-api-credentials'
import test from 'tape'

const PROJECT_KEY =
  process.env.CT_PROJECT_KEY || process.env.npm_config_projectkey

test('getApiCredentials should exist', (t) => {
  t.ok(getApiCredentials)
  t.end()
})

test('getApiCredentials should error when there is no project key', (t) => {
  getApiCredentials()
    .then(t.fail)
    .catch((error) => {
      t.true(error)
      t.end()
    })
})

test('getApiCredentials should use project key', (t) => {
  getApiCredentials(PROJECT_KEY)
    .then((credentials) => {
      t.true(credentials)
      t.end()
    })
    .catch(t.fail)
})

test('getApiCredentials should use access token', (t) => {
  getApiCredentials(PROJECT_KEY, 'cotter-access-token')
    .then((credentials) => {
      t.true(credentials)
      t.end()
    })
    .catch(t.fail)
})
