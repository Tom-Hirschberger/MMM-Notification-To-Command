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

  runScript: function (cmd, args, sync, notification, value) {
    const self = this

	console.log("VALUE is: "+value)

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
      let spawnOutput = spawnSync(curCmd, curArgs)

      if (spawnOutput.stderr != null){
        let error = spawnOutput.stderr.toString().trim()
        if (error != ""){
          console.log(self.name + ': Error during script '+cmd+": ")
          console.log(spawnOutput.stderr.toString())
        }
      }
    } else {
      let child = spawn(curCmd, curArgs)

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
		console.log(JSON.stringify(payload))
    	self.config = payload

		let notifications = self.config.notifications

		for (let notification in notifications){
			for (let i = 0; i < self.config.notifications[notification].cmds.length; i++) {
				let cmdObj = self.config.notifications[notification].cmds[i]
				let cmd = cmdObj.cmd
				if (typeof cmdObj.args === "undefined"){
					if (cmd.indexOf(" ") !== -1) {
						cmd_split = cmd.split(" ")
						self.config.notifications[notification].cmds[i].args = cmd_split.slice(1)
						self.config.notifications[notification].cmds[i].cmd = cmd_split[0]
					} else {
						self.config.notifications[notification].cmds[i].args = []
					}
				}
			}
		}

    	self.started = true
    } else {
      if (self.started){
		let cmds = self.config.notifications[notification].cmds
		let curCmdsTransformers = [].concat(self.config.transformers)
		if (typeof self.config.notifications[notification].transformers !== "undefined"){
			curCmdsTransformers = curCmdsTransformers.concat(self.config.notifications[notification].transformers)
		}

		let curCmdsConditions = [].concat(self.config.conditions)
		if (typeof self.config.notifications[notification].conditions !== "undefined"){
			curCmdsConditions = curCmdsConditions.concat(self.config.notifications[notification].conditions)
		}

		for (var i = 0; i < cmds.length; i++) {
			let cmd = self.config.notifications[notification].cmds[i].cmd
			let args = self.config.notifications[notification].cmds[i].args

			let curCmdTransformers = [].concat(curCmdsTransformers)
			if (typeof self.config.notifications[notification].cmds[i].transformers !== "undefined"){
				curCmdTransformers = curCmdTransformers.concat(self.config.notifications[notification].cmds[i].transformers)
			}

			let curCmdConditions = [].concat(curCmdsConditions)
			if (typeof self.config.notifications[notification].cmds[i].conditions !== "undefined"){
				curCmdConditions = self.config.notifications[notification].cmds[i].conditions
			}

			let value = payload

			if (curCmdTransformers != null){
				for (let curTransformerIdentifier of curCmdTransformers){
					console.log("Calling transformer: "+curTransformerIdentifier)
					let curTransformer = self.config.transformerFunctions[curTransformerIdentifier]
					if (typeof curTransformer !== "undefined") {
						try {
							console.log("VALUE_BEFORE: "+value)
							value = curTransformer(value)
							console.log("VALUE_AFTER */: "+value)
						} catch (exception) {
							console.log("Error during call of transformer function: "+curTransformerIdentifier+".")
							console.log(exception)
						}
					} else {
						console.log("Is undefined!")
					}
				}
			}

			if(typeof self.config.notifications[notification].cmds[i].sync !== 'undefined'){
				sync = self.config.notifications[notification].cmds[i].sync
			} else {
				sync = false
			}

			if (curCmdConditions != null){
				let conditionsValid = true
				for(let curCondIdx = 0; curCondIdx < curCmdConditions.length; curCondIdx++){
					let curCondition = curCmdConditions[curCondIdx]
					if((typeof curCondition["type"] !== "undefined") && (typeof curCondition["value"] !== "undefined")){
						if(!self.validateCondition(value,curCondition["value"],curCondition["type"])){
						  conditionsValid = false
						  break
						}
					}
				}

				if (conditionsValid){
					self.runScript(cmd, args, sync, notification, value)
				}
			} else {
				self.runScript(cmd, args, sync, notification, value)
			}
		}
      }
    }
  }
})

