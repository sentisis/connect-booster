# connect-booster

This service receives your messages from [Sentisis Connect](http://learning.sentisis.io/sentisis-connect/introduccion-a-sentisis-connect) and boost the Tweets before forwarding them to your webhook.

## Rationale

In order to abide by [Twitter's usage terms](https://developer.twitter.com/en/developer-terms/agreement-and-policy.html), Séntisis is not allowed to share Twitter data with third parties. By using this service with your own credentials you will be able to get all that Séntisis offers (sentiment analysis, categorization...) while seamlessly keeping data from Twitter.  

## Features

* **Docker-ready**: setup everything with just a command!
* **Bulk lookup**: to prevent hitting Twitter API's rate limits
* **Highly configurable**: to fit everybody's needs
* **Resilient**: it will retry failed requests several times before giving up

## Format

For a `POST` request to `/` (or any other path actually) the input should have this format:

```javascript
{
  id: String, // Séntisis id
  msgId: String, // Twitter id 
  type: String, // Tweet | ReTweet | FacebookPost | FacebookComment | InstagramPost | InstagramComment | YoutubeVideo | YoutubeComment
  sentiment: String, // POSITIVE | NEGATIVE | OBJECTIVE
  categories: [
    {
      id: String,
      name: String,
    }
  ],
  feed: {
    id: String,
    name: String,
  },
  user: {
    gender: String, // MALE | FEMALE | UNKNOWN
    location: {
      country: String,
      region: String,
    },
  }
}
```

And send this to the webhook:

```javascript
{
  id: String, // Séntisis id
  msgId: String, // Twitter id 
  type: String, // Tweet | ReTweet | FacebookPost | FacebookComment | InstagramPost | InstagramComment | YoutubeVideo | YoutubeComment
  sentiment: String, // POSITIVE | NEGATIVE | OBJECTIVE
  categories: [
    {
      id: String,
      name: String,
    }
  ],
  feed: {
    id: String,
    name: String,
  },
  user: {
    gender: String, // MALE | FEMALE | UNKNOWN
    location: {
      country: String,
      region: String,
    },
    username: String,
    id: String, // Twitter id
    name: String,
    followers: Number,
    friends: Number,
  },
  link: String,
  text: String,
  date: String, // ISO-8601
}
```

## Requirements

Your server should:
* Have [docker](https://www.docker.com/) installed
* Have access to your webhook URL
* Have access to the internet in order to interact with Twitter's API

## Walkthrough

### 1. Setup connect-booster in your network

Make sure you meet all the previously mentioned requirements. Say your webhook address is `http://webhook.my-company.com/sentisis` and you want to make the service available at port 3000. Run this command with your settings to start the service:
```
$ docker run -e FORWARD_URL=http://webhook.my-company.com/sentisis -e PORT=3000\
-e TW_CONSUMER_KEY=<YOUR_CONSUMER_KEY> -e TW_CONSUMER_SECRET=<YOUR_CONSUMER_SECRET> \
-e TW_ACCESS_TOKEN=<YOUR_ACCESS_TOKEN> -e TW_ACCESS_TOKEN_SECRET=<YOUR_ACCESS_TOKEN_SECRET> \
-p 3000:3000 --name connect-booster -d --restart always sentisis/connect-booster:1.0.0
```

If everything went fine, the service is now ready to receive `POST` requests with messages from Séntisis (json).

### 2. Make sure it is publicly available

You can either check the logs or hit `/healthcheck` from outside your network.

### 3. Ask Séntisis to setup Séntisis Connect providing your connect-booster's URL

### 4. Séntisis will start sending messages from your feeds. Done!

## Environment variables

| Key                      | Required | Default | Description                                                                                                         |
| ------------------------ | -------- | ------- | ------------------------------------------------------------------------------------------------------------------- |
| `FORWARD_URL`            | yes      | -       | Fully qualified URL of the webhook                                                                                  |
| `TW_CONSUMER_KEY`        | yes      | -       | Your Twitter account's consumer key                                                                                 |
| `TW_CONSUMER_SECRET`     | yes      | -       | Your Twitter account's consumer secret                                                                              |
| `TW_ACCESS_TOKEN`        | yes      | -       | Your Twitter account's access token                                                                                 |
| `TW_ACCESS_TOKEN_SECRET` | yes      | -       | Your Twitter account's access token secret                                                                          |
| `TW_BUFFER_SIZE`         | no       | 10      | Maximum amount of tweets to ask the Twitter's API for at once                                                       |
| `TW_BUFFER_INTERVAL`     | no       | 10000   | Interval to flush (process) all accumulated tweets. In miliseconds                                                  |
| `DISCARD_NOT_ENRICHED`   | no       | false   | Whether to discard or forward failed messages (tweets that were not enriched due to i.e. an error on Twitter's API) |
| `PORT`                   | no       | 8080    | HTTP port for the service to listen to                                                                              |

## Versions

Check the project's [dockerhub](https://hub.docker.com/r/sentisis/connect-booster/tags/)

## Development

### Built with

* [node.js](https://nodejs.org/)
* [docker](https://www.docker.com/)
* [micro](https://github.com/zeit/micro)

### Start
```
$ FORWARD_URL=http://localhost:5555 \
TW_CONSUMER_KEY=<YOUR_CONSUMER_KEY> TW_CONSUMER_SECRET=<YOUR_CONSUMER_SECRET> \
TW_ACCESS_TOKEN=<YOUR_ACCESS_TOKEN> TW_ACCESS_TOKEN_SECRET=<YOUR_ACCESS_TOKEN_SECRET> \
yarn start
```

### Test
```
$ yarn test
```
