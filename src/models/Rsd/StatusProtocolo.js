const mongoose = require('mongoose')

const statusProcoloScheema = new mongoose.Schema({
    descricao: String,
    ativo: Boolean
})

module.exports = mongoose.model('StatusProtocolo', statusProcoloScheema)