# `amqplib-retryable`

[![NPM Version][npm-image]][npm-url]
[![Build][ci-image]][ci-url]

Create a channel that supports an exponential-backoff strategy for retrying failed attempts to consume messages on a RabbitMQ queue.

## Installation (via [npm][npm-url])

```bash
$ npm install -S amqplib-retryable
```

## Usage

```javascript
const amqplib = require( "amqplib" );
const retryable = require( "amqplib-retryable" );

Promise
	.resolve( amqplib.connect( "amqp://localhost" ) )
	.then( conn => conn.createChannel() )
	.then( channel => retryable( channel, {
		initialDelay: 5000,
		maxRetries: 5,
		separator: "."
	} )
	.then( channel => {
		return channel.consume( QUEUES.consumer, ( msg ) => {
			// if this handler throws an error or returns a rejected promise, it will be retried
			msg.ack();
			console.log( msg );
		} );
	} )
	.catch( err => {
		console.error( "Failed to process", err );
	} );

```

## Options

__channel__ (required):  Amqplib channel.  See: [connection.createChannel()](http://www.squaremobius.net/amqp.node/channel_api.html#model_createChannel)
__initialDelay__ (optional): Delay in milliseconds between retries.  Default: `5000`
__maxRetries__ (optional):  Maximum number of retries before dead-lettering.  Default: `5`
__separator__ (options): The retry queue separator to use (ie, `delayed.retry.consumer-queue.10s`).  Default: `.`


[npm-image]: https://badge.fury.io/js/amqplib-retryable.svg
[npm-url]: https://npmjs.org/package/amqplib-retryable
[ci-image]: https://travis-ci.org/Bunk/amqplib-retryable.svg?branch=master
[ci-url]: https://travis-ci.org/Bunk/amqplib-retryable
