const mongoose = require('mongoose')

const horariosSCheema = new mongoose.Schema({
    enfermeiro: String,
    dia: String,
    horario: String,
    agendado: String,
    proposta: String,
    nome: String,
    quemReabriu: String,
    quemFechou: String,
    justificativa: String,
})

module.exports = mongoose.model('Horario', horariosSCheema)