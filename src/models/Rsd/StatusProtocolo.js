const mongoose = require('mongoose')

const statusProcoloScheema = mongoose.Schema({
    descricao: String,
    ativo: Boolean
})

module.exports = mongoose.model('StatusProtocolo', statusProcoloScheema)