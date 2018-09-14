let winsay = require('winsay')

function Winsay (settingsInstance) {
    this.settings = settingsInstance

    this.speechqueue = []
    this.speaking = false

    setInterval(() => {
        if (this.speaking === false && this.speechqueue.length !== 0 && this.settings.get('silence') !== true) {
            this.speaking = true
            winsay.speak(null, this.speechqueue[0], () => {
                this.speechqueue = this.speechqueue.slice(1)
                this.speaking = false
            })
        } else {
            this.speechqueue = []
        }
    }, 300)

    /**
     * Queues up speech for the bot to say
     * @param {string} sentence The sentence for the bot to speak out
     */
    this.say = function (sentence) {
        this.speechqueue[this.speechqueue.length] = sentence
    }
}

module.exports = Winsay
