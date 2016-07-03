
'use strict'

const dotenv = require('dotenv')
const ENV = process.env.NODE_ENV || 'development'

if (ENV === 'development') dotenv.load()

const config = {
  ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  PROXY_URI: process.env.PROXY_URI,
  WEBHOOK_URL: process.env.WEBHOOK_URL,
  APP_COMMAND_TOKEN: process.env.APP_COMMAND_TOKEN,
  SLACK_TOKEN: process.env.SLACK_TOKEN,
  ICON_EMOJI: ':beers:',
  MONGODB_URI: process.env.MONGODB_URI,
  GOOGLE_API_NAME: process.env.GOOGLE_API_NAME,
  GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
  GOOGLE_CSE_CX: process.env.GOOGLE_CSE_CX
}

module.exports = (key) => {
  if (!key) return config

  return config[key]
}
