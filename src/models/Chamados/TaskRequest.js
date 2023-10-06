const mongoose = require('mongoose')

const taskScheema = new mongoose.Schema({
    colaborador: String,
    setor: String,
    assunto: String,
    descricao: String,
    leonardo: Boolean,
    rodrigo: Boolean,
    gerson: Boolean,
    analista: String,
    verificado: Boolean,
    tratando: Boolean,
    finalizado: Boolean,
    status: String,
    retorno: String,
    dataInicio: String,
    dataFinalizado: String
}, {timestamps: true})

module.exports = mongoose.model('TaskRequest', taskScheema)