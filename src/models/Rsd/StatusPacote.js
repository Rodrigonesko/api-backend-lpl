const mongoose = require('mongoose')

const statusPacoteScheema = new mongoose.Schema({
    descricao: String,
    ativo: Boolean
})

module.exports = mongoose.model('StatusPacote', statusPacoteScheema)