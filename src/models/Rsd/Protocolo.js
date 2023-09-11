const mongoose = require('mongoose')

const protocoloScheema = new mongoose.Schema({
    numero: String,
    mo: String,
    dataSolicitacao: Date,
    dataPagamento: Date,
    cnpj: String,
    clinica: String,
    profissional: String,
    crm: String,
    idStatus: String,
    dataSla: String,
    ativo: Boolean,
    status: String,
    operador: String,
    dataStatus: Date,
    analista: String,
    dataInclusao: Date,
    pessoa: String
}, {
    timestamps: true
})

module.exports = mongoose.model('Protocolo', protocoloScheema)