let config = require('./config.js')
let utils = require('./utils.js')

let youtubedl = require('youtube-dl')
let YouTube = require('youtube-node')
let fs = require('fs')
let VLC = require('node-vlc-json')
let musicmetadata = require('node-ffprobe')

function Music (bot, speechInstance, settingsInstance) {
    this.bot = bot
    this.speech = speechInstance
    this.settings = settingsInstance

    this.player = new VLC(config.music)
    this.youtubeapi = new YouTube()
    this.youtubeapi.setKey(config.youtubeKey)

    // Every half second check if VLC is still playing, if not change song and edit playing.json
    setInterval(() => {
        this.player.status((status) => {
            if (status.state === 'stopped') {
                // Queue up next song
                let json = JSON.parse(fs.readFileSync('./playing.json', { encoding: 'UTF-8' }))

                if (typeof json[0] === 'undefined' || json[0] === null) {
                    // Pick a random song from the songs folder and play it
                    let songs = fs.readdirSync(config.music.path)
                    if (typeof songs[0] === 'undefined' || songs[0] === null)
                        return
                    let song = songs[Math.floor(Math.random() * songs.length)]

                    this.youtubeapi.getById(song.split('.')[0], (err, res) => {
                        if (err) throw err

                        musicmetadata(config.music.path + song, (err, metadata) => {
                            if (err) throw err;

                            fs.writeFileSync('./currentlyplaying.txt', song.split('.')[0] + ',gogbot,' + Math.round(metadata.format.duration) + ',' + res.items[0].snippet.title)
                        })

                        this.player.play(config.music.path + song, () => {
                            this.speech.say('Now playing "' + res.items[0].snippet.title + '"')
                        })
                    })
                } else {
                    this.youtubeapi.getById(json[0].id, (err, res) => {
                        if (err) throw err

                        this.player.play(config.music.path + json[0].id + '.m4a', () => {
                            this.speech.say('Now playing "' + res.items[0].snippet.title + '", requested by ' + json[0].from)
                        })

                        musicmetadata(config.music.path + json[0].id + '.m4a', (err, metadata) => {
                            if (err) throw err;

                            fs.writeFileSync('./currentlyplaying.txt', json[0].id + ',' + json[0].from + ',' + Math.round(metadata.format.duration) + ',' + res.items[0].snippet.title)
                        })

                        fs.writeFileSync('./playing.json', JSON.stringify(json.slice(1)))
                    })
                }
            }
        })
    }, 500)

    this.queue = function (videoid, from) {
        if (this.settings.get('music') === false) {
            if (from === 'gogbot') {

            } else {
                this.bot.say('The music module has been disabled')
            }
            return
        }

        this.youtubeapi.getById(videoid, (err, res) => {
            if (err) throw err

            if (res.items[0].snippet.categoryId === '10' || res.items[0].snippet.categoryId === '24')  {
                let json = JSON.parse(fs.readFileSync('./playing.json', { encoding: 'UTF-8' }))
                let playing = fs.readFileSync('./currentlyplaying.txt', { encoding: 'UTF-8' })
                if (json.length !== 10) {
                    for (let item of json) {
                        if (videoid === item.id) {
                            if (from === 'gogbot') {
                                console.log(from + ', you cannot queue a song twice.')
                            } else {
                                this.bot.say(from + ', you cannot queue a song twice.')
                            }
                            return
                        }
                    }

                    if (videoid === playing.split(',')[0]) {
                        if (from === 'gogbot') {
                            console.log('This song is already playing, ' + from + '...')
                        } else {
                            this.bot.say('This song is already playing, ' + from + '...')
                        }
                        return
                    }

                    this.youtubeapi.getById(videoid, (err, res) => {
                        if (err) throw err

                        json[json.length] = { id: videoid, from: from, title: res.items[0].snippet.title }

                        let filename = config.music.path + videoid + '.m4a'
                        let baseurl = 'https://www.youtube.com/watch?v='

                        if (utils.doesFileExist(filename) === true) {
                            if (from === 'gogbot') {
                                console.log('Song already downloaded, queuing...')
                            } else {
                                this.bot.say('Song already downloaded, queuing...')
                            }

                            fs.writeFileSync('./playing.json', JSON.stringify(json))
                        } else {
                            if (from === 'gogbot') {
                                console.log('Downloading song, one moment...')
                            } else {
                                this.bot.say('Downloading song, one moment...')
                            }

                            youtubedl.exec(baseurl + videoid, ['-o', filename, '--extract-audio', '--audio-format', 'm4a'], {}, (err, output) => {
                                if (err) throw err

                                if (from === 'gogbot') {
                                    console.log('Song has finished download, queuing...')
                                } else {
                                    this.bot.say('Song has finished download, queuing...')
                                }

                                fs.writeFileSync('./playing.json', JSON.stringify(json))
                            })
                        }
                    })
                } else {
                    if (from === 'gogbot') {
                        console.log('There cannot be more than ten songs queued at once.')
                    } else {
                        this.bot.say('There cannot be more than ten songs queued at once.')
                    }
                }
            } else {
                if (from === 'gogbot') {
                    console.log('You cannot play a video that is not in the "Music" category on YouTube.')
                } else {
                    this.bot.say('You cannot play a video that is not in the "Music" category on YouTube.')
                }
            }
        })
    }

    this.pauseSong = function () {
        this.player.pause(() => {})
    }

    this.nextSong = function (from) {
        this.player.stop(() => {
            if (from === 'gogbot') {
                console.log('Playing next song...')
            } else {
                this.bot.say('Playing next song...')
            }
        })
    }
}

module.exports = Music
