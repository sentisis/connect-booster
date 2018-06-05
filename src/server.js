/* eslint-disable no-console */
const micro = require('micro')
const { json, send } = require('micro')
const { router, get, post } = require('microrouter')

const boost = ctx => async (req, res) => {
  const message = await json(req)
  // don't wait for it
  ctx.messageManager.handle(message)
  send(res, 200)
}

const healthcheck = async (req, res) => {
  send(res, 200, {
    FORWARD_URL: process.env.FORWARD_URL ? 'OK' : 'KO',
    TW_BUFFER_SIZE: process.env.TW_BUFFER_SIZE,
    TW_BUFFER_INTERVAL: process.env.TW_BUFFER_INTERVAL,
    DISCARD_NOT_ENRICHED: process.env.DISCARD_NOT_ENRICHED,
  })
}

module.exports = ctx => {
  return micro(
    // prettier-ignore
    router(
      get('/healthcheck', healthcheck),
      post('/', boost(ctx))
    ),
  )
}
