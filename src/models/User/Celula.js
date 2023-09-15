const mongoose = require('mongoose')

const Scheema = new mongoose.Schema({
    celula: String
})

module.exports = mongoose.model('Celula', Scheema)