const mongoose = require('mongoose')

const dicionarioScheema = mongoose.Schema({
    palavra: String
})

module.exports = mongoose.model('Dicionario', dicionarioScheema)