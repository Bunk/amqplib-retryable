/* eslint-env mocha */
const { assert, sinon, amqplib } = require('../test/helpers')
const factory = require('./index')

const topology = {
  exchange: 'testing',
  queue: 'test.q'
}

describe('retry channel', () => {
  let connection, channel, retryable, message

  beforeEach(async () => {
    connection = await amqplib.connect('amqp://localhost')
    channel = await connection.createChannel()
    await channel.assertExchange(topology.exchange)
    await channel.assertQueue(topology.queue)
  })

  async function sendToQueue (retryCount) {
    const headers = retryCount ? { 'x-retries': retryCount } : undefined
    await channel.sendToQueue(topology.queue, {}, { headers })
    message = channel.trackedMessages[ 1 ]
  }

  context('given the default settings when consuming a queue', () => {
    beforeEach(() => {
      retryable = factory(channel)
    })

    context('and an error occurs during processing', () => {
      beforeEach(() => {
        return retryable.consume(topology.queue, () => {
          return Promise.reject(new Error('Go Boom'))
        })
      })

      context('and the message has never been retried', () => {
        beforeEach(() => {
          return sendToQueue()
        })

        it('should retry the message on the correct exchange', () => {
          assert.equal(message.fields.exchange, 'delayed.retry.test.q.5s')
        })

        it('should set the retries header to 1', () => {
          assert.nestedPropertyVal(message, 'properties.headers.x-retries', 1)
        })
      })

      context('and the message has been retried 1 time', () => {
        beforeEach(() => {
          return sendToQueue(1)
        })

        it('should retry the message on the correct exchange', () => {
          assert.equal(message.fields.exchange, 'delayed.retry.test.q.10s')
        })

        it('should increment the retries header', () => {
          assert.nestedPropertyVal(message, 'properties.headers.x-retries', 2)
        })
      })

      context('and the message has been retried 2 times', () => {
        beforeEach(() => {
          return sendToQueue(2)
        })

        it('should retry the message on the correct exchange', () => {
          assert.equal(message.fields.exchange, 'delayed.retry.test.q.20s')
        })

        it('should increment the retries header', () => {
          assert.nestedPropertyVal(message, 'properties.headers.x-retries', 3)
        })
      })

      context('and the message has been retried 3 times', () => {
        beforeEach(() => {
          return sendToQueue(3)
        })

        it('should retry the message on the correct exchange', () => {
          assert.equal(message.fields.exchange, 'delayed.retry.test.q.40s')
        })

        it('should increment the retries header', () => {
          assert.nestedPropertyVal(message, 'properties.headers.x-retries', 4)
        })
      })

      context('and the message has been retried 4 times', () => {
        beforeEach(() => {
          return sendToQueue(4)
        })

        it('should dead-letter the message', () => {
          assert.calledOnce(channel.reject)
          assert.calledWithMatch(channel.reject, sinon.match.object, false)
        })
      })

      context('and the server closes the consumer', () => {
        let error
        beforeEach(() => {
          return channel.closeConsumer(topology.queue).catch(err => (error = err))
        })

        it('should reject with an error', () => {
          assert.isNotNull(error)
        })
      })

      context('and an error happens while retrying', () => {
        let thrown

        beforeEach(() => {
          channel.ack.throws(new Error('Woops!'))
          return sendToQueue().catch(err => {
            thrown = err
          })
        })

        it('should nack the message', () => {
          assert.called(channel.nack)
        })

        it('should reject with the error', () => {
          assert.isNotNull(thrown)
        })
      })
    })
  })

  afterEach(() => {
    amqplib.reset()
  })
})
