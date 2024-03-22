# MMM-Notification-To-Command
MMMM-Notification-To-Command is a module for the [MagicMirror](https://github.com/MichMich/MagicMirror) project by [Michael Teeuw](https://github.com/MichMich).

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

### Notifications

| Option  | Description | Type | Mandatory |
| ------- | --- | --- | --- |
| cmds | A array containing command objects | Array | true |

### Commands

| Option  | Description | Type | Mandatory |
| ------- | --- | --- | --- |
| cmd | A string containing the command you want to call with all of its options. | String | true |
| sync | A flag which indicates if the script should wait for the command to finished before it calls the next command in the list | Boolean | false |
