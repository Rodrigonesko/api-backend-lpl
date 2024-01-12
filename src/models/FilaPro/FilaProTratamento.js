const mongoose = require('mongoose')

const Scheema = new mongoose.Schema({
    protocolo: String,
    pedido: String,
    codificacao: String,
    beneficiario: String,
    dataSolicitacao: String,
    dataPagamento: String,
    status: String,
    valorApresentado: String,
    valorReembolsado: String,
    cnpj: String,
    clinica: String,
    statusConclusao: String,
    dataConclusao: String,
    dataRecebimento: String
}, {
    timestamps: true
})