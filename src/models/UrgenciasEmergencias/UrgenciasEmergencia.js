const mongoose = require('mongoose')

const UrgenciaEmergenciaScheema = mongoose.Schema({
    dataRecebimento: String,
    numAssociado: String,
    proposta: String,
    dataInclusao: String,
    nomeAssociado: String,
    dataNascimento: String,
    idade: String,
    responsavel: String,
    telefone: String,
    email: String,
    dataSolicitacao: String,
    nomePrestador: String,
    cid: String,
    descricaoCid: String,
    sitAutoriz: String,
    relatorioMedico: String,
    obsUnder: String,
    contato1: String,
    contato2: String,
    contato3: String,
    retorno: String,
    observacoes: String,
    status: String,
    analista: String,
    dataConclusao: String
}, {
    timestamps: true
})

module.exports = mongoose.model('UrgenciasEmergencia', UrgenciaEmergenciaScheema)

