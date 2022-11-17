const mongoose = require('mongoose')

const prcScheema = mongoose.Schema({
    descricao: String
})

module.exports = mongoose.model('Prc', prcScheema)