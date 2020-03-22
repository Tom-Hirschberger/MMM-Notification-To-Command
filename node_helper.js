/* Magic Mirror
 * Module: Screen-Powersave-Notification
 *
 * By Tom Hirschberger
 * MIT Licensed.
 */
const NodeHelper = require('node_helper')
const exec = require('child_process').exec
const execSync = require('child_process').execSync

module.exports = NodeHelper.create({

  start: function () {
    this.started = false
  },

  runScript: function (cmd, sync) {
    const self = this
    console.log(self.name + ': Running script: ' + cmd)

    if(sync){
      execSync(cmd, function (error, stdout, stderr) {
        if (error) {
          console.log(stderr)
        }
      });
    } else {
      exec(cmd, function (error, stdout, stderr) {
        if (error) {
          console.log(stderr)
        }
      });
    }
  },

  socketNotificationReceived: function (notification, payload) {
    const self = this
    if (notification === 'CONFIG' && self.started === false) {
      self.config = payload
      self.started = true
    } else {
      if(typeof self.config.notifications[notification] !== 'undefined'){
        console.log(JSON.stringify(self.config))
        console.log(this.name+ ": " + notification)
        console.log(this.name + ': Received Notification: ' + notification + " now running configured command")
        cmds = self.config.notifications[notification].cmds

        for (var i = 0; i < cmds.length; i++) {
          cmd = self.config.notifications[notification].cmds[i].cmd

          if(typeof self.config.notifications[notification].cmds[i].sync !== 'undefined'){
            sync = self.config.notifications[notification].cmds[i].sync
          } else {
            sync = false
          }

          self.runScript(cmd, sync)
        }
      }
    }
  }
})
