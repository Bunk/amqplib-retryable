const amqpDelay = require('amqp-delay.node')

const DEFAULTS = {
  initialDelay: 5000,
  maxRetries: 5,
  separator: '.',
  onFailed: () => {}
}

module.exports = (channel, {
  initialDelay = DEFAULTS.initialDelay,
  maxRetries = DEFAULTS.maxRetries,
  separator = DEFAULTS.separator,
  onFailed = DEFAULTS.onFailed
} = {}) => {
  amqpDelay(channel, { prefix: 'delayed', separator })

  const _originalConsume = channel.consume.bind(channel)

  channel.consume = async (queue, fn, opt) => {
    const retryExchange = `retry${separator}${queue}`
    await channel.assertExchange(retryExchange, 'fanout', { durable: true })
    await channel.bindQueue(queue, retryExchange, '#')

    async function retry (msg, retryCount) {
      const delayAmount = Math.pow(2, retryCount - 1) * initialDelay // eslint-disable-line no-magic-numbers
      return channel
        .delay(delayAmount)
        .publish(retryExchange, msg.fields.routingKey, msg.content, msg.properties)
    }

    async function attemptRetry (msg, originatingError) {
      try {
        const headers = msg.properties.headers || {}
        const retryCount = (headers[ 'x-retries' ] || 0) + 1
        if (retryCount >= maxRetries) {
          // We're past our retry max count.  Dead-letter it.
          channel.reject(msg, false)
          onFailed(originatingError)
        } else {
          headers[ 'x-retries' ] = retryCount
          msg.properties.headers = headers
          await retry(msg, retryCount)
          channel.ack(msg)
        }
      } catch (err) {
        // Something blew up while retrying—requeue the message.
        channel.nack(msg)
        throw err
      }
    }

    channel.retry = attemptRetry

    return _originalConsume(queue, (msg) => {
      if (!msg) return Promise.reject(new Error('Broker cancelled the consumer remotely'))
      // TODO: Support non-promises
      return fn(msg).catch(err => attemptRetry(msg, err))
    }, opt)
  }

  return channel
}
