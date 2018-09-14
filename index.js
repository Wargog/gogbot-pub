let config = require('./config.js')
let Settings = require('./settings.js')
let Speech = require('./winsay.js')
let Commands = require('./commands.js')
let Music = require('./music.js')
let WebServer = require('./website.js')

let settings
let speech
let music
let commands
let webserver

let fs = require('fs')
let readline = require('readline')
let lctv = require('node-livecodingtv')
let colors = require('colors')
let FFPlay = require('ffplay')

console.log('...... Bootstrapping ......')

let bot = new lctv.ChatBot(config)

console.log('...... Starting bot interface ......')

bot.connectToServer()
bot.on('online', () => {
    bot.join(config.channel)

    // Spin up VLC and class instances
    console.log('...... Spinning up VLC and youtube-dl instance ......')
    settings = new Settings()
    speech = new Speech(settings)
    music = new Music(bot, speech, settings)
    webserver = new WebServer(music)

    setTimeout(() => {
        bot.on('join', onJoin)
        bot.on('leave', onLeave)
        bot.on('message', onMessage)
        bot.on('command', onCommand)

        console.log('...... Instantiating API and command classes ......')
        commands = new Commands(bot, music, speech, settings)

        console.log('...... BOT ONLINE! ......')

        start()
    }, 1500)
})


start = function () {
    let rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: false
    })

    rl.on('line', onConsoleInput)
}

onJoin = function (data) {
    if (!data.who.includes('bot')) {
        if (data.role === 'viewer') {
            let message = 'Welcome to the nut house, ' + data.who + '.'
            setTimeout(() => {
                if (bot.viewers().indexOf(data.who) !== -1) {
                    bot.say(message)
                    speech.say(data.who + ', welcome to the stream')
                }
            }, 10000)
        } else if (data.role === 'moderator') {
            let message = data.who + ' has joined, behave yourselves!'
            setTimeout(() => {
                if (bot.viewers().indexOf(data.who) !== -1) {
                    bot.say(message)
                }
            }, 5000)
        } else if (data.who.includes('wargog')) {
            bot.say('King Wargog has arrived!')
        }
    }
}

onLeave = function (data) {
    if (!data.who.includes('bot')) {
        if (data.role === 'viewer') {
            let message = 'Cya later, ' + data.who + '!'
            setTimeout(() => {
                if (bot.viewers().indexOf(data.who) === -1) {
                    speech.say('Goodbye, ' + data.who)
                }
            }, 6000)
        }
    }
}

onMessage = function (data) {
    if (!data.from.includes('bot')) {
        if (data.message.slice(0, 1) === '/' && data.message.slice(1, 2) !== ' ' && data.message.toLowerCase().slice(1).split(' ')[0] !== 'code') {
            // This is a command, so give a shit
            let command = data.message.toLowerCase().slice(1).split(' ')[0]
            let params = data.message.split(' ').slice(1)

            if (command in commands) {
                commands[command](params, data.from, data.role)
            } else {
                bot.say('Command "' + command + '" not found')
            }
        } else {
            let player = new FFPlay('./new-message.wav')
            console.log(colors.bgMagenta.grey('      message from ' + data.from + ':'), colors.bgBlack.green(data.message))
            player = null
        }
    }
}

onCommand = function (data) {
    if (!data.from.includes('bot')) {
        if (data.command in commands) {
            commands[data.command](data.params, data.from, data.role)
        } else {
            bot.say('Command "' + data.command + '" not found')
        }
    }
}

onConsoleInput = function (data) {
    if (data.toString().slice(0, 1) === '!' || data.toString().slice(0, 1) === '/' && data.toString().slice(1, 2) !== ' ') {
        let command = data.toString().toLowerCase().slice(1).split(' ')[0]
        let params = data.toString().split(' ').slice(1)
        if (command in commands) {
            commands[command](params, 'gogbot', 'owner')
        } else {
            console.log('command', command, 'not found')
        }
    } else {
        bot.say(data.toString())
    }
}
