/* global Module

/* Magic Mirror
 * Module: Notification-To-Command
 *
 * By Tom Hirschberger
 * MIT Licensed.
 */
Module.register('MMM-Notification-To-Command', {

  defaults: {
    notifications: {},
    transformerFunctions: {},
    transformers: [],
    conditions: [],
    shell: "/bin/bash",
    spawnOptions: {}
  },

  start: function () {
    const self = this
    Log.info("Starting module: " + self.name);

    let curConfigTransformers = self.config.transformers
    let curConfigConditions = self.config.conditions
    let curConfigShell = self.config.shell
    let curConfigSpawnOptions = self.config.spawnOptions
    for (let curNotification in self.config.notifications){
      let curNotificationTransformers = self.config.notifications[curNotification].transformers
      if (typeof curNotificationTransformers === "undefined"){
        curNotificationTransformers = []
      }

      let curNotificationConditions = self.config.notifications[curNotification].conditions
      if (typeof curNotificationConditions === "undefined"){
        curNotificationConditions = []
      }

      let curNotificationShell = self.config.notifications[curNotification].shell
      if (typeof curNotificationShell === "undefined"){
        curNotificationShell = curConfigShell
      }

      let curNotificationSpawnOptions = self.config.notifications[curNotification].spawnOptions
      if (typeof curNotificationSpawnOptions === "undefined"){
        curNotificationSpawnOptions = curConfigSpawnOptions
      }

      let curCmds = self.config.notifications[curNotification].cmds
      for (let curCmdIdx = 0; curCmdIdx < curCmds.length; curCmdIdx++){

        let curCmdTransformers = curCmds[curCmdIdx].transformers
        if (typeof curCmdTransformers === "undefined"){
          curCmdTransformers = []
        }

        let curCmdConditions = curCmds[curCmdIdx].conditions
        if (typeof curCmdConditions === "undefined"){
          curCmdConditions = []
        }

        let curCmdShell = curCmds[curCmdIdx].shell
        if (typeof curCmdShell === "undefined"){
          curCmdShell = curNotificationShell
        }

        let curCmdSpawnOptions = curCmds[curCmdIdx].spawnOptions
        if (typeof curCmdSpawnOptions === "undefined"){
          curCmdSpawnOptions = curNotificationSpawnOptions
        }
        
        let curTransformers = [].concat(curConfigTransformers)
        curTransformers = curTransformers.concat(curNotificationTransformers)
        curTransformers = curTransformers.concat(curCmdTransformers) 

        self.config.notifications[curNotification].cmds[curCmdIdx].transformers = curTransformers
        
        let curConditions = [].concat(curConfigConditions)
        curConditions = curConditions.concat(curNotificationConditions)
        curConditions = curConditions.concat(curCmdConditions) 

        self.config.notifications[curNotification].cmds[curCmdIdx].conditions = curConditions

        self.config.notifications[curNotification].cmds[curCmdIdx].shell = curCmdShell
        curCmdSpawnOptions["shell"] = curCmdShell

        self.config.notifications[curNotification].cmds[curCmdIdx].spawnOptions = curCmdSpawnOptions
      }
    }
    self.sendSocketNotification('CONFIG', self.config)
  },

  notificationReceived: function (notification, payload) {
    const self = this
    if (typeof self.config.notifications[notification] !== "undefined"){
      if (typeof self.config.notifications[notification].cmds !== "undefined"){
        let curCmds = self.config.notifications[notification].cmds

        let values = {}

        for (let curCmdIdx = 0; curCmdIdx < curCmds.length; curCmdIdx++){
          let curValue = payload
          for (let curTransformerIdx = 0; curTransformerIdx < self.config.notifications[notification].cmds[curCmdIdx].transformers.length; curTransformerIdx++){
            let curTransformer = self.config.notifications[notification].cmds[curCmdIdx].transformers[curTransformerIdx]
            let curTranformerFunction = self.config.transformerFunctions[curTransformer]
            if(typeof curTranformerFunction !== "undefined"){
              curValue = curTranformerFunction(curValue)
            } else {
              console.log("Could not call transformer: "+curTransformer+" cause it is not defined!")
            }
          }
          values[curCmdIdx] = curValue
        }
        this.sendSocketNotification(notification, values)
      }
    }
  }
})
