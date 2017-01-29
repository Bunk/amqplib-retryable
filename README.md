## rabbit-topology

	Initial release designed to generate a topology definition.
	Other libraries are used to generate the topology given an amqp client library.

Produce a rabbit topology definition from a DSL.

### Domain-Specific Language

TODO:  Formally define the DSL

```js
{
	exchanges: {
		"events": {
			type: "fanout",
			bindings: {
				queues: {
					ingress: {
						name: "rawEvents.queue",
						durable: true,
						prefetch: 250,
						deadLetterExchange: {
							name: "ingress.dlx",
							type: "fanout",
							bindings: {
								queues: {
									"ingress.dlq": {
										durable: true
									}
								}
							}
						}
					}
				}
			}
		},
		"publication": {
			type: "fanout",
			bindings: {
				exchanges: {
					"publication.topic": {
						type: "topic"
					}
				}
			}
		}
	}
};
```
