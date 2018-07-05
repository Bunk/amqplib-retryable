const path = require('path')
const proxy = require('proxyquire').noPreserveCache()

const ROOT_PATH = path.join(__dirname, '../../')

module.exports = {
  proxyquire (module, ...args) {
    if (module.startsWith('~')) {
      module = path.join(ROOT_PATH, module.substr(1))
    }
    return proxy(module, ...args)
  }
}
