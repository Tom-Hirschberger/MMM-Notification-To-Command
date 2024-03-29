# MMM-Notification-To-Command

MMM-Notification-To-Command is a module for the [MagicMirror](https://github.com/MichMich/MagicMirror) project by [Michael Teeuw](https://github.com/MichMich).

It runs system commands (scripts) based on received notifications. One received notification can trigger multible scripts either in synchronous or asynchronous way.

## Installation

```sh
    cd ~/MagicMirror/modules
    git clone https://github.com/Tom-Hirschberger/MMM-Notification-To-Command.git
    cd MMM-Notification-To-Command
    npm install
```

## Configuration

To display the module insert it in the config.js file. Here is an example:

```js
    {
        module: 'MMM-Notification-To-Command',
        config: {
            notifications:{
                'SHUTDOWN_CONTROLLER':{
                    'cmds':[
                        {
                            cmd: 'sudo shutdown -h now',
                            sync: true
                        }
                    ]
                }
            },
        }
    }
```

| Option  | Description | Type | Default |
| ------- | --- | --- | --- |
| notifications | A map containing which contains the name of the notifications you want to react on as keys and a object for each notification | Map | {} |
| transformerFunctions | A map of functions to transform the payload or the result of on of the other transformerFunktions. These functions can be referenced by their name in the `transformers` array.  | Map | {} |
| transformers | A list of names of transformerFunctions which should be called for every notification in the notifications map. The order of the function names in this array is the order they will be executed. | Array | [] |
| conditions | Only if all of these conditions are met the commands will be executed. These conditions are used for all notifications. | Array | [] |
| shell | The shell that should be used to call the commands of all notifications. | String | "/bin/bash" |
| spawnOptions | Additional options which should be used during the call of the commands of all notifications. Look at [the offical NodeJS->Childprocess->Spawn documentation](https://nodejs.org/api/child_process.html#child_processspawncommand-args-options) for more information. **The shell in the options will be overwritten by the shell option in the config of the module.** | Map | {} |

### Notifications

| Option  | Description | Type | Mandatory |
| ------- | --- | --- | --- |
| cmds | A array containing command objects | Array | true |
| transformers | A list of names of transformerFunctions which should be called for every command of this notification. The order of the function names in this array is the order they will be executed. **If tranformers are configured in the main config they will be executed first!** | Array | [] |
| conditions | Only if all of these conditions and all global configured conditions are met the commands will be executed. These conditions are used for all commands of this notification. **If global conditions are configured they need to be met, too!** | Array | [] |
| shell | The shell that should be used to call the commands of this notification. **This value overrides the global configured value!** | String | "/bin/bash" |
| spawnOptions | Additional options which should be used during the call of the commands of this notification. Look at [the offical NodeJS->Childprocess->Spawn documentation](https://nodejs.org/api/child_process.html#child_processspawncommand-args-options) for more information. **The shell in the options will be overwritten by the shell option in this configuration** | Map | {} |

### Commands

| Option  | Description | Type | Mandatory |
| ------- | --- | --- | --- |
| cmd | A string containing the command you want to call with all of its arguments. **The command will be split into the command and the arguments by split at spaces. If you specify a `args` array the `cmd` will not be split!** | String | true |
| args | A array containing the arguments to call the command with. If this array is set the `cmd` will not be split! | Array | undefined |
| sync | A flag which indicates if the script should wait for the command to finished before it calls the next command in the list | Boolean | false |
| transformers | A list of names of transformerFunctions which should be called before the command is executed. The order of the function names in this array is the order they will be executed. **If tranformers are configured in the main config and/or the notification they will be executed first!** | Array | [] |
| conditions | Only if all of these conditions and all global configured conditions are met the commands will be executed. These conditions are used for this command only. **If conditions are configured global or for the notification they need to be met, too!** | Array | [] |
| shell | The shell that should be used to call the commands of this notification. **This value overrides the value configured in the global or notification settings!** | String | "/bin/bash" |
| spawnOptions | Additional options which should be used during the call of the command. Look at [the offical NodeJS->Childprocess->Spawn documentation](https://nodejs.org/api/child_process.html#child_processspawncommand-args-options) for more information. **The shell in the options will be overwritten by the shell option in this configuration** | Map | {} |

### Passing the notification or payload as argument of the command

The id of the notification can be referenced by "###NOTIFICATION###" the value of the notification with "###VALUE###" in the arguments of a command.

If transformers are used the modified value will be used!

In this example...

```js
{
    module: 'MMM-Notification-To-Command',
    config: {
        notifications:{
            'TEST1':{
                'cmds':[
                    {
                        cmd: '/test.bash ###VALUE###',
                    },
                    {
                        cmd: '/test2.bash',
                        args:[ "###NOTIFICATION###", "###VALUE###"],
                    }
                ]
            }
        },
    }
},
```

if a notification "TEST1" with the payload "12345" will be received to following is happening:

* the script `/test.bash` will be executed with "12345" as the first argument
* the script `/test2.bash` will be executed with "TEST1" as the first and "12345" as the second argument

### Using transformerFunctions and transformers

You can specify JavaScript functions to modify the payload of the notification before passing it as argument.

In the following example...

```js
{
    module: 'MMM-Notification-To-Command',
    config: {
        transformerFunctions: {
            attachOne: (value) => {
                return value+"1"
            },
            attachTwo: (value) => {
                return value+"2"
            },
            replaceByFour: () => {
                return 4
            }
        },
        transformers: ["attachOne"],
        notifications:{
            'TEST1':{
                'cmds':[
                    {
                        cmd: '/test.bash ###VALUE###',
                    },
                    {
                        transformers: ["attachOne"],
                        cmd: '/test.bash ###VALUE###',
                    }
                ]
            },
            'TEST2':{
                transformers: ["attachTwo"],
                'cmds':[
                    {
                        transformers: ["attachOne", "replaceByFour"],
                        cmd: '/test2.bash ###VALUE###',
                    }
                ]
            },
        },
    }
},
```

if a notification "TEST1" with payload "abc" is received the following will happen:

* As "attachOne" is configured as global transformer "abc" will be append with a "1" to "abc1" and the command "/test.bash" is executed with it as first argument.
* As another "attachOne" is configured as transformer for the second command "/test.bash" is executed a second time but with "abc11" as first argument.

if a notification "TEST2" with payload "abc" is received the following will happen:

* As "attachOne" is configured as global transformer "abc" will be append with a "1" to "abc1"
* As "attachTwo" is configured as transformer for all commands of this notification "abc1" will be appended by a "2" to "abc12"
* As "attachOne" is configured as transformer for the command "abc12" will be appended with another "1" to "abc121"
* As "replaceByFour" is configured as another transformer for the command "abc121" will be replaced with "4"
* The command "/test2.bash" then will be executed with "4" as first argument

### Conditions

If you want command to be only executed if some conditions are met by the payload or transformed value of the notification you can use this configuration option.

**All condtions needs to be met for the command to be run!**

Conditions need to be specified as `type` and with a `value`.

Valid types are:

* `eq`: The payload value needs to be equal the configured value
* `lt`: The payload value needs to be lower than the configured value
* `le`: The payload value needs to be lower or equal the configured value
* `gt`: The payload value needs to be greater than the configured value
* `ge`: The payload value needs to be greater or equal the configured value
* `incl`: The payload needs to include the value conigured
* `mt`: The payload needs to match the conigured regex value (Look a this [syntax cheat sheet](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions/Cheatsheet) for more information)

In this example...

```js
{
    module: 'MMM-Notification-To-Command',
    config: {
        notifications:{
            'TEST1':{
                'cmds':[
                    {
                        cmd: '/test1.bash',
                    },
                    {
                        conditions: [
                            {
                                type:"le",
                                value: 5
                            },
                            {
                                type:"gt",
                                value: 1
                            },
                        ],
                        cmd: '/test2.bash',
                    },
                    {
                        conditions: [
                            {
                                type:"le",
                                value: 5
                            },
                            {
                                type:"gt",
                                value: 3
                            },
                        ],
                        cmd: '/test3.bash',
                    }
                ]
            },
        },
    }
},
```

If a notification "TEST1" is received with payload "3" the following will happen:

* the script "/test1.bash" will be executed
* the script "/test2.bash" will be executed as the value 3 is lower or equal 5 and greater than 1
* the script "/test3.bash" will NOT be executed as the value 3 is lower or equal 5 but it is not greater than 3

In this example...

```js
{
    module: 'MMM-Notification-To-Command',
    config: {
        notifications:{
            'TEST1':{
                'cmds':[
                    {
                        conditions: [
                            {
                                type:"incl",
                                value: "abc"
                            },
                        ],
                        cmd: '/test1.bash',
                    },
                    {
                        conditions: [
                            {
                                type:"mt",
                                value: "^abc.*"
                            },
                        ],
                        cmd: '/test2.bash',
                    }
                ]
            },
        },
    }
},
```

if a notification "TEST1" with the payload "123abc123" is received the following will happen:

* the script "/test1.bash" is executed as the string "123abc123" contains the string "abc"
* the script "/test2.bash" will NOT be executed as the string "123abc123" does not start ("^") with "abc" followed by any characters (".*")
