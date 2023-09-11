const mongoose = require('mongoose')

const Scheema = new mongoose.Schema({
    data: String,
    proposta: String,
    beneficiario: String,
    confirmacao: String,
    meioSolicitacao: String,
    meioConfirmacao: String,
    resultado: String,
    responsavel: String,
    observacoes: String,
    status: String,
    dataConclusao: String,
    dataInclusao: String
}, {
    timestamps: true
})

module.exports = mongoose.model('PropostaElegibilidadeManual', Scheema)