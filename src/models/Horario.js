const mongoose = require('mongoose')

const horariosSCheema = mongoose.Schema({
    enfermeiro: String,
    dia: String,
    horario: String,
    agendado: String,
    proposta: String,
    nome: String
})

module.exports = mongoose.model('Horario', horariosSCheema)