function Settings () {
    this.settings = {
        silence: false,
        music: true
    }

    this.set = function (key, value) {
        this.settings[key] = value
    }

    this.get = function (key) {
        return this.settings[key]
    }
}

module.exports = Settings
