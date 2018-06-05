/* eslint-disable no-console */
const server = require('./server')
const { URL } = require('url')
const Twitter = require('twit')
const MessageManager = require('./MessageManager')

const PORT = process.env.PORT || 8080

const validate = () => {
  // Mandatory configuration
  const MANDATORY_VARIABLES = [
    'FORWARD_URL',
    'TW_CONSUMER_KEY',
    'TW_CONSUMER_SECRET',
    'TW_ACCESS_TOKEN',
    'TW_ACCESS_TOKEN_SECRET',
  ]
  MANDATORY_VARIABLES.forEach(variable => {
    if (!process.env[variable]) {
      console.log(`You didn't specified the ${variable}`)
      process.exit(1)
    }

    try {
      new URL(process.env.FORWARD_URL)
    } catch (e) {
      console.log('Wrong FORWARD_URL format')
      process.exit(1)
    }
  })
}

const getContext = () => {
  const twitterClient = new Twitter({
    consumer_key: process.env.TW_CONSUMER_KEY,
    consumer_secret: process.env.TW_CONSUMER_SECRET,
    access_token: process.env.TW_ACCESS_TOKEN,
    access_token_secret: process.env.TW_ACCESS_TOKEN_SECRET,
  })
  const forwardUrl = process.env.FORWARD_URL

  return {
    messageManager: new MessageManager({ twitterClient, forwardUrl }),
  }
}

validate()
server(getContext()).listen(PORT, () => {
  console.log(`connect-booster listening on port ${PORT}`)
})
