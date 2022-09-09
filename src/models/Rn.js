const mongoose = require('mongoose')

const rnScheema = mongoose.Schema({
    data: String,
    beneficiario: String,
    mo: String,
    proposta: String,
    vigencia: String,
    pedido: String,
    tipo: String,
    filial: String,
    idade: Number,
    dataRecebimento: String,
    procedimento: String,
    doenca: String,
    cid: String,
    periodo: String,
    prc: String,
    telefones: String,
    email: String,
    contato1: {
        data: String,
        horario: String
    },
    contato2: {
        data: String,
        horario: String
    },
    contato3: {
        data: String,
        horario: String
    },
    observacoes: String,
    status: String
})

module.exports = mongoose.model('Rn', rnScheema)