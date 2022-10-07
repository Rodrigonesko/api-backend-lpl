const mongoose = require('mongoose')

const horariosSCheema = mongoose.Schema({
    enfermeira: String,
    dia: Date,
    horario: String,
    agendado: String,
    proposta: String,
    nome: String
})

module.exports = mongoose.model('Horario', horariosSCheema)