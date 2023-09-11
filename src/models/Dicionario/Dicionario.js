const mongoose = require('mongoose')

const dicionarioScheema = new mongoose.Schema({
    palavra: String
})

module.exports = mongoose.model('Dicionario', dicionarioScheema)