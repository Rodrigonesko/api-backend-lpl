const mongoose = require('mongoose')

const atividadeScheema = mongoose.Schema({
    analista: String,
    atividade: String,
    horarioInicio: String,
    horarioFim: String,
    data: String,
    mes: String,
    totalHoras: String
})

module.exports = mongoose.model('ControleAtividade', atividadeScheema)