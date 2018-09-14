let express = require('express')
let fs = require('fs')

function Website (musicInstance) {
    this.music = musicInstance

    this.app = express()

    this.app.use(express.static('www/public'))

    this.app.get('/playing', (req, res) => {
        res.send(fs.readFileSync('./www/playing.html', { encoding: 'UTF-8' }))
    })

    this.app.get('/playing/txt', (req, res) => {
        res.send(fs.readFileSync('./currentlyplaying.txt', { encoding: 'UTF-8' }))
    })

    this.app.listen(9875, () => {
        console.log('...... Web server listening on port 9875 ......')
    })
}

module.exports = Website
