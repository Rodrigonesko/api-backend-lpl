const mongoose = require('mongoose')

const pacoteScheema = mongoose.Schema({
    codigo: String,
    dataSla: String,
    ativo: Boolean,
    status: String,
    processando: Boolean,
    etapa: String,
    dossie: String
})

module.exports = mongoose.model('Pacote', pacoteScheema)