const mongoose = require('mongoose')

const protocoloScheema = mongoose.Schema({
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
    operadorId: String,
    dataStatus: Date,
    idUsuario: String,
    dataInclusao: Date,
    pessoa: String
}, {
    timestamps: true
})

module.exports = mongoose.model('Protocolo', protocoloScheema)