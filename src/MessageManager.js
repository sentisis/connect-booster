/* eslint-disable no-console */
const axios = require('axios')
const axiosRetry = require('axios-retry')
const { compact } = require('lodash')
const { get, groupBy } = require('lodash/fp')

global.Promise = require('bluebird')
axiosRetry(axios, { retries: 5, retryDelay: axiosRetry.exponentialDelay })

const TW_BUFFER_SIZE = process.env.TW_BUFFER_SIZE || 10
const TW_BUFFER_INTERVAL = process.env.TW_BUFFER_INTERVAL || 10000 // 10 seconds
const DISCARD_NOT_ENRICHED = process.env.DISCARD_NOT_ENRICHED || false

class MessageManager {
  constructor({ twitterClient, forwardUrl }) {
    this.twitterClient = twitterClient
    this.forwardUrl = forwardUrl

    this.tweetsBuffer = []
    this.tweetsBufferLocked = false

    setInterval(this.bulkProcessTweets.bind(this), TW_BUFFER_INTERVAL)
  }

  async handle(message) {
    const { type } = message
    if (type === 'Tweet' || type === 'ReTweet') {
      this.tweetsBuffer.push(message)
      if (this.tweetsBuffer.length >= TW_BUFFER_SIZE)
        return this.bulkProcessTweets()
    } else {
      return this.forward(message)
    }
  }

  async bulkProcessTweets() {
    if (this.tweetsBufferLocked || this.tweetsBuffer.length <= 0) return

    this.tweetsBufferLocked = true
    const messages = this.tweetsBuffer.splice(0, TW_BUFFER_SIZE)
    let enriched = messages
    try {
      const ids = messages.map(m => m.msgId)
      const { data } = await this.twitterClient.get('statuses/lookup', {
        id: ids.join(),
        include_entities: false,
      })
      if (!data) throw new Error('Error while accessing Twitter API')

      // id_str instead of id: https://developer.twitter.com/en/docs/basics/twitter-ids.html
      const tweetsById = groupBy('id_str', data)
      enriched = await Promise.map(messages, async message => {
        const tweet = tweetsById[message.msgId][0]
        return this.enrichTweet(tweet, message)
      })
      enriched = compact(enriched)
    } catch (e) {
      console.log(e.stack)
      if (DISCARD_NOT_ENRICHED) {
        console.log('Error: Discarding messages')
        this.tweetsBufferLocked = false
        return
      }
      // continue otherwise
    }

    const result = await Promise.map(enriched, this.forward.bind(this))
    this.tweetsBufferLocked = false
    return result
  }

  enrichTweet(tweet, message) {
    const { msgId } = message
    if (!tweet) {
      console.log(
        `Discard message with id ${msgId} - no Twitter info available`,
      )
      return DISCARD_NOT_ENRICHED ? null : message
    }

    const username = get('user.screen_name', tweet)
    const link = username
      ? `https://twitter.com/${username}/status/${msgId}`
      : ''

    const user = {
      ...message.user,
      username,
      id: get('user.id_str', tweet),
      name: get('user.name', tweet),
      followers: get('user.followers_count', tweet),
      friends: get('user.friends_count', tweet),
    }

    return {
      ...message,
      user,
      link,
      text: get('text', tweet),
      date: new Date(Date.parse(get('created_at', tweet))),
    }
  }

  async forward(message) {
    try {
      return await axios.post(this.forwardUrl, message)
    } catch (e) {
      const { msgId } = message
      console.log(`Error while forwarding message with id ${msgId}`, e.message)
      return
    }
  }
}

module.exports = MessageManager
