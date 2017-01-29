const assertionUtils = require( "./assertions" );
const utils = require( "./utils" );
const amqplib = require( "./mocks/amqplib" );

global.testHelpers = {
	amqplib,
	chai: assertionUtils.chai,
	assert: assertionUtils.assert,
	sinon: assertionUtils.sinon,
	proxyquire: utils.proxyquire
};
