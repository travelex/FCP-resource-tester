'use strict'

class NoLogsGroup {
  constructor (serverless, options) {
    this.hooks = {
      'before:package:finalize': function () { removeCloudwatchLogsDefinition(serverless) }
    }
  }
}

function removeCloudwatchLogsDefinition (serverless) {
  let rsrc = serverless.service.provider.compiledCloudFormationTemplate.Resources
  for (let key in rsrc) {
    if (rsrc[key].Type === 'AWS::Logs::LogGroup') {
      delete rsrc[key]
    }
    else if (rsrc[key].Type === 'AWS::Lambda::Function') {
      let dependencies = []
      for (let dependency of rsrc[key].DependsOn) {
        if (dependency.endsWith('LogGroup') === false) {
          dependencies.push(dependency)
        }
      }
      rsrc[key].DependsOn = dependencies
    }
  }
}

module.exports = NoLogsGroup
