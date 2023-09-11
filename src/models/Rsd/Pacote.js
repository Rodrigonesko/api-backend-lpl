const mongoose = require('mongoose')

const pacoteScheema = new mongoose.Schema({
    codigo: String,
    dataSla: String,
    ativo: Boolean,
    status: String,
    processando: Boolean,
    etapa: String,
    dossie: String,
    analista: String
})

module.exports = mongoose.model('Pacote', pacoteScheema)