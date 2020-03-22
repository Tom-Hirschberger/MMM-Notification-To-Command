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
```s

<br>

| Option  | Description | Type | Default |
| ------- | --- | --- | --- |

