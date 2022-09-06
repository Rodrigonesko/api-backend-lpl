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
    contato1: String,
    contato2: String,
    contato3: String,
    observacoes: String

})

module.exports = mongoose.model('Rn', rnScheema)