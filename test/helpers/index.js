const assertions = require('./assertions')
const utils = require('./utils')
const amqplib = require('amqplib-mocks')

module.exports = Object.assign({ amqplib }, assertions, utils)
