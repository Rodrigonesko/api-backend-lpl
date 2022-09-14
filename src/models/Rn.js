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
    dataContato1: String,
    dataContato2: String,
    dataContato3: String,
    horarioContato1: String,
    horarioContato2: String,
    horarioContato3: String,
    observacoes: String,
    status: String
}, {
    timestamps: true
})

module.exports = mongoose.model('Rn', rnScheema)