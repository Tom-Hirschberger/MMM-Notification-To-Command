/* Magic Mirror
 * Module: Notification-To-Command
 *
 * By Tom Hirschberger
 * MIT Licensed.
 */
const NodeHelper = require('node_helper')
const exec = require('child_process').exec
const execSync = require('child_process').execSync
const spawn = require('child_process').spawn
const spawnSync = require('child_process').spawnSync

module.exports = NodeHelper.create({

  start: function () {
    this.started = false
  },

  runScript: function (cmd, sync) {
    const self = this
    console.log(self.name + ': Running script: ' + cmd)

    let args = []
    let curCmd = cmd
    if (cmd.indexOf(" ") !== -1) {
        cmd_split = cmd.split(" ")
        args = cmd_split.slice(1)
        curCmd = cmd_split[0]
    }

    if(sync){
      let spawnOutput = spawnSync(curCmd, args)

      if (spawnOutput.stderr != null){
        let error = error.toString().trim()
        if (error != ""){
          console.log(self.name + ': Error during script '+cmd+": ")
          console.log(spawnOutput.stderr.toString())
        }
      }
    } else {
      let child = spawn(curCmd, args)

      let scriptErrorOutput = ""
      child.stderr.on('data', (data) => {
        scriptErrorOutput+=data.toString()
      });

      child.on('close', function(code) {
        scriptErrorOutput = scriptErrorOutput.trim()

        if (scriptErrorOutput != "") {
          console.log(self.name + ': Error during script call: ')
          console.log(scriptErrorOutput)
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
      if (self.started){
        if(typeof self.config.notifications[notification] !== 'undefined'){
          console.log(JSON.stringify(self.config))
          console.log(this.name+ ": " + notification)
          console.log(this.name + ': Received Notification: ' + notification + " now running configured command")
          cmds = self.config.notifications[notification].cmds
  
          for (var i = 0; i < cmds.length; i++) {
            console.log("Running with idx: "+i)
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
  }
})
