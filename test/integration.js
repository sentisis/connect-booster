/* eslint-env jest */
/* eslint-disable no-underscore-dangle */
const test = require('ava')
const listen = require('test-listen')
const request = require('axios')
const nock = require('nock')
const sinon = require('sinon')
const waitUntil = require('async-wait-until')

const input = {
  id: 'id_sentisis',
  sentiment: 'OBJECTIVE',
  categories: [
    {
      id: 'categoryId1',
      name: 'categoryName1',
    },
    {
      id: 'categoryId2',
      name: 'categoryName2',
    },
  ],
  feed: {
    id: 'feedId',
    name: 'feedName',
  },
  user: {
    gender: 'MALE',
    location: {
      country: 'España',
      region: 'Madrid',
    },
  },
  msgId: 'id_twitter',
  type: 'Tweet',
}

const twitterResponse = {
  data: [
    {
      created_at: 'Tue Jun 13 10:19:14 +0000 2017',
      id: 1111,
      id_str: 'id_twitter',
      text: 'Hi there',
      user: {
        id: 2222,
        id_str: 'user_id_twitter',
        name: 'Fulano',
        screen_name: 'fulano',
        followers_count: 300,
        friends_count: 42,
      },
    },
  ],
}

const expectedOutput = {
  ...input,
  link: 'https://twitter.com/fulano/status/id_twitter',
  text: 'Hi there',
  user: {
    gender: 'MALE',
    location: {
      country: 'España',
      region: 'Madrid',
    },
    username: 'fulano',
    id: 'user_id_twitter',
    name: 'Fulano',
    followers: 300,
    friends: 42,
  },
  date: '2017-06-13T10:19:14.000Z',
}

test('A twitter message is received, enriched and forwarded', async t => {
  process.env.TW_BUFFER_SIZE = 1
  // We require this now so that the environment variables have the right value
  const MessageManager = require('../src/MessageManager')
  const server = require('../src/server')

  const forwardUrl = 'http://localhost:5555'
  nock(forwardUrl)
    .post('/', expectedOutput)
    .times(1)
    .reply(200)

  const getStub = sinon.stub().returns(Promise.resolve(twitterResponse))
  const twitterClient = { get: getStub }
  const ctx = {
    messageManager: new MessageManager({ twitterClient, forwardUrl }),
  }

  const micro = server(ctx)
  const url = await listen(micro)
  const response = await request.post(url, input)

  t.true(getStub.calledOnce)
  t.true(
    getStub.calledWith('statuses/lookup', {
      id: input.msgId,
      include_entities: false,
    }),
  )
  t.true(response.status === 200)
  const nockIsDone = await waitUntil(nock.isDone, 1000)
  t.true(nockIsDone)
  micro.close()
})
