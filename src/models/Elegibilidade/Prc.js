const mongoose = require('mongoose')

const prcScheema = new mongoose.Schema({
    descricao: String
})

module.exports = mongoose.model('Prc', prcScheema)