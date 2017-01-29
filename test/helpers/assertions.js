const sinon = require( "sinon" );
require( "sinon-as-promised" );

const chai = require( "chai" );
const chaiAsPromised = require( "chai-as-promised" );
const chaiSubset = require( "chai-subset" );
const sinonChai = require( "sinon-chai" );

const assert = chai.assert;
chai.use( chaiAsPromised );
chai.use( chaiSubset );
chai.use( sinonChai );
sinon.assert.expose( chai.assert, { prefix: "" } );

module.exports = {
	sinon, chai, assert
};
