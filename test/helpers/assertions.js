const sinon = require('sinon')
const chai = require('chai')
const chaiSubset = require('chai-subset')

const assert = chai.assert
chai.use(chaiSubset)
sinon.assert.expose(chai.assert, { prefix: '' })

module.exports = {
  sinon, chai, assert
}
