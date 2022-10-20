const mongoose = require('mongoose')

const statusPacoteScheema = mongoose.Schema({
    descricao: String,
    ativo: Boolean
})

module.exports = mongoose.model('StatusPacote', statusPacoteScheema)