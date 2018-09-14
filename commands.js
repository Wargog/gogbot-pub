let config = require('./config.js')

let fs = require('fs')

function Commands (bot, musicInstance, speechInstance, settingsInstance) {
    this.bot = bot
    this.music = musicInstance
    this.speech = speechInstance
    this.settings = settingsInstance

    this.help = function (params) {
        let helpstrings = ''
        let helpnum = 1

        let json = JSON.parse(fs.readFileSync('./strings.json', {encoding: 'UTF-8'}))

        if (params.length === 0) {
            for (let s of json.help) {
                helpstrings += '\n(' + helpnum + '): ' + s
                helpnum++
            }

            this.bot.say('Gogbot by Wargog: https://joshstroup.xyz/chatbot')
            this.bot.say('------------(( HELP SECTION ))------------\n' + helpstrings)
        } else {
            if (params[0].toLowerCase() in json.commandhelp) {
                for (let s of json.commandhelp[params[0].toLowerCase()]) {
                    helpstrings += '\n(' + helpnum + '): ' + s
                    helpnum++
                }

                this.bot.say('--------(( HOW TO USE "' + params[0].toUpperCase() +'" ))--------' + helpstrings)
            } else {
                this.bot.say('Help for command "' + params[0] + '" not found.')
            }
        }
    }

    this.play = function (params, from) {
        if (typeof params[0] !== 'undefined' && params[0].length === 11) {
            this.music.queue(params[0], from)
        } else if (typeof params[1] !== 'undefined' || params[1] !== null) {
            if (from === 'gogbot') {
                console.log('Searching for song...')
            } else {
                this.bot.say('Searching for song...')
            }
            this.qsearch(params, from)
        } else {
            if (from === 'gogbot') {
                console.log('You must specify a song to play')
            } else {
                this.bot.say('You must specify a song to play, ' + from)
            }
        }
    }

    this.pause = function (params, from, role) {
        if (role === 'moderator' || role === 'owner') {
            this.music.pauseSong()
        } else {
            this.bot.say(from + ': you don\'t have permission to run this command')
        }
    }

    this.skip = function (params, from, role) {
        let current = fs.readFileSync('./currentlyplaying.txt', { encoding: 'UTF-8' })

        if (role === 'moderator' || role === 'owner') {
            this.music.nextSong(from)

            if (params[0] === 'rm' || params[0] === 'remove') {
                setTimeout(() => {
                    fs.unlinkSync(config.music.path + current.split(',')[0] + '.m4a')
                }, 700)

                if (from === 'gogbot') {
                    console.log('Removed song', current.split(',')[3])
                } else {
                    this.bot.say('Removed song ' + current.split(',')[3])
                }
            }
        } else if (from === current.split(',')[1]) {
            this.music.nextSong(from)
        } else {
            this.bot.say('You cannot skip a song that you didn\'t queue')
        }
    }

    this.set = function (params, from, role) {
        if (role === 'owner' || from === 'gogbot') {
            this.settings.get(params[0]) === false ? this.settings.set(params[0], true) : this.settings.set(params[0], false)

            if (from === 'gogbot') {
                console.log('Set "' + params[0] + '" to ' + this.settings.get(params[0]))
            } else {
                this.bot.say('Set "' + params[0] + '" to ' + this.settings.get(params[0]))
            }
        } else {
            this.bot.say(from + ': you don\'t have permission to run this command')
        }
    }

    this.q = function (params, from) {
        this.play(params, from)
    }

    this.qsearch = function (params, from) {
        if (typeof params[0] !== 'undefined' && params[0] !== null) {
            let searchterm = ''
            let videoid = ''
            let channelid = ''
            let categoryid = ''
            let subscribers = ''

            for (let s of params)
                searchterm += s + ' '

            this.music.youtubeapi.search(searchterm, 1, (err, res) => {
                if (err) throw err

                if (typeof res.items[0] === 'undefined' || res.items[0] === null) {
                    if (from === 'gogbot') {
                        console.log('No songs could be found using that search term, try using the ID of the video you want to play.')
                    } else {
                        this.bot.say('No songs could be found using that search term, try using the ID of the video you want to play.')
                    }
                } else {
                    videoid = res.items[0].id.videoId
                    channelid = res.items[0].snippet.channelId

                    this.music.youtubeapi.getById(videoid, (err, res) => {
                        if (err) throw err

                        categoryid = res.items[0].snippet.categoryId

                        this.music.youtubeapi.getByChannelId(channelid, (err, res) => {
                            if (err) throw err

                            subscribers = res.items[0].statistics.subscriberCount

                            if (categoryid === '10' || categoryid === '24' && parseInt(subscribers) > 5000) {
                                this.music.queue(videoid, from)
                            } else {
                                if (from === 'gogbot') {
                                    console.log('Could not find acceptable song, try using the ID of the video you want to play.')
                                } else {
                                    this.bot.say('Could not find acceptable song, try using the ID of the video you want to play.')
                                }
                            }
                        })
                    })
                }
            })
        } else {
            if (from === 'gogbot') {
                console.log('You must specify a song to search for.')
            } else {
                this.bot.say('You must specify a song to search for.')
            }
        }
    }

    this.playing = function (params, from) {
        let currentsong = fs.readFileSync('./currentlyplaying.txt', { encoding: 'UTF-8' })

        if (from === 'gogbot') {
            console.log('Currently playing "' + currentsong.split(',', 3)[2] + '", requested by ' + currentsong.split(',')[1])
        } else {
            this.bot.say('Currently playing "' + currentsong.split(',', 3)[2] + '", requested by ' + currentsong.split(',')[1])
        }

    }

    this.playlist = function (params, from) {
        let playliststrings = ''
        let songnum = 1

        let json = JSON.parse(fs.readFileSync('./playing.json', {encoding: 'UTF-8'}))

        for (let s of json) {
            playliststrings += '\n(' + songnum + '): ' + s.title
            songnum++
        }

        if (from === 'gogbot') {
            console.log('------------(( PLAYLIST ))------------\n' + playliststrings)
        } else {
            this.bot.say('------------(( PLAYLIST ))------------\n' + playliststrings)
        }
    }

    this.viewers = function (params, from, role) {
        if (role === 'owner') {
            if (from === 'gogbot') {
                console.log(this.bot.viewers().toString())
            } else {
                this.bot.say('---------- VIEWERS ----------\n', this.bot.viewers().toString())
            }
        } else {
            this.bot.say(from, ': you don\'t have permission to use this command')
        }
    }
}

module.exports = Commands
