/* Magic Mirror
 * Module: Notification-To-Command
 *
 * By Tom Hirschberger
 * MIT Licensed.
 */
const NodeHelper = require('node_helper')
const spawn = require('child_process').spawn
const spawnSync = require('child_process').spawnSync

module.exports = NodeHelper.create({

  start: function () {
    this.started = false
  },

  validateCondition: function(source, value, type){
    if (type == "eq"){
      if ((typeof source === "number") || (this.isAString(source))){
        return source === value
      } else {
        return JSON.stringify(source) === value
      }
    } else if (type == "incl"){
      if (this.isAString(source)){
        return source === value
      } else {
        return JSON.stringify(source).includes(value)
      }
    } else if (type == "mt") {
      if (this.isAString(source)){
        return new RegExp(value).test(source)
      } else {
        return new RegExp(value).test(JSON.stringify(source))
      }
    } else if (type == "lt"){
      return source < value
    } else if (type == "le"){
      return source <= value
    } else if (type == "gt"){
      return source > value
    } else if (type == "ge"){
      return source >= value
    }

    return false
  },

  runScript: function (cmd, args, options, sync, notification, value) {
    const self = this
	let curCmd = cmd.replaceAll("###NOTIFICATION###",notification)
	curCmd = curCmd.replaceAll("###VALUE###", value)

	let curArgs = []
	for (var i = 0; i < args.length; i++) {
		let curArg = args[i]
		if (curArg == "###NOTIFICATION###") {
			curArgs.push(notification)
		} else if (curArg == "###VALUE###"){
			curArgs.push(value)
		} else {
			curArgs.push(curArg)
		}
	}
	console.log(self.name + ': Running script: ' + curCmd + " with args: "+curArgs)

    if(sync){
		let spawnOutput = spawnSync(curCmd, curArgs, options)

		if (spawnOutput.stderr != null){
			let error = spawnOutput.stderr.toString().trim()
			if (error != ""){
			console.log(self.name + ': Error during script '+cmd+": ")
			console.log(spawnOutput.stderr.toString())
			}
		}
    } else {
		let child = spawn(curCmd, curArgs, options)

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

		for (let curNotification in self.config.notifications){
			for (let i = 0; i < self.config.notifications[curNotification].cmds.length; i++) {
				let cmdObj = self.config.notifications[curNotification].cmds[i]
				let cmd = cmdObj.cmd
				if (typeof cmdObj.args === "undefined"){
					if (cmd.indexOf(" ") !== -1) {
						cmd_split = cmd.split(" ")
						self.config.notifications[curNotification].cmds[i].args = cmd_split.slice(1)
						self.config.notifications[curNotification].cmds[i].cmd = cmd_split[0]
					} else {
						self.config.notifications[curNotification].cmds[i].args = []
					}
				}
			}
		}

    	self.started = true
    } else {
		if (self.started){
			let curCmds = self.config.notifications[notification].cmds

			for (let curCmdIdx = 0; curCmdIdx < curCmds.length; curCmdIdx++){
				let curCmd = curCmds[curCmdIdx].cmd
				let curArgs = curCmds[curCmdIdx].args
				let curSpawnOptions = curCmds[curCmdIdx].spawnOptions
				let curValue = payload[curCmdIdx]
				let curConditions = curCmds[curCmdIdx].conditions

				let conditionsValid = true
				for (let curConditionIdx = 0; curConditionIdx < curConditions.length; curConditionIdx++){
					let curCondition = curConditions[curConditionIdx]
					if((typeof curCondition["type"] !== "undefined") && (typeof curCondition["value"] !== "undefined")){
						if(!self.validateCondition(curValue,curCondition["value"],curCondition["type"])){
							conditionsValid = false
							break
						}
					}
				}

				if (conditionsValid){
					let sync = false
					if(typeof curCmds[curCmdIdx].sync !== 'undefined'){
						sync = curCmds[curCmdIdx].sync
					}

					self.runScript(curCmd, curArgs, curSpawnOptions, sync, notification, curValue)
				}
			}
		}
	}
  }
})

