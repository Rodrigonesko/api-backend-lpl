const mongoose = require('mongoose')

const Scheema = new mongoose.Schema({
    nome: String,
    quantidadeRepeticao: String,
    diario: Boolean,
    semanal: Boolean,
    quinzenal: Boolean,
    mensal: Boolean,
    trimestral: Boolean,
    semestral: Boolean,
    anual: Boolean,
    dataInicio: String,
    descricao: String,
    proximasDatas: [],
}, {
    timestamps: true
})

const Agenda = mongoose.model('Agenda', Scheema)

module.exports = Agenda