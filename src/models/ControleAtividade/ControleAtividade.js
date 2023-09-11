const mongoose = require('mongoose')

const atividadeScheema = new mongoose.Schema({
    analista: String,
    atividade: String,
    horarioInicio: String,
    horarioFim: String,
    data: String,
    mes: String,
    totalHoras: String,
    encerrado: Boolean
})

module.exports = mongoose.model('ControleAtividade', atividadeScheema)