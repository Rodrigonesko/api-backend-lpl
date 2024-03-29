const mongoose = require('mongoose')

const rnScheema = new mongoose.Schema({
    data: String,
    beneficiario: String,
    mo: String,
    proposta: String,
    vigencia: String,
    vigenciaLpl: String,
    vifencia: String,
    pedido: String,
    tipo: String,
    filial: String,
    idade: String,
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
    status: String,
    respostaBeneficiario: String,
    dataConclusao: String,
    responsavel: String,
    agendado: String,
    dataEntrevista: String,
    faturado: String,
    dataFaturamento: String,
    nf: String,
    cancelado: String,
    analistaAmil: String
}, {
    timestamps: true
})

module.exports = mongoose.model('Rn', rnScheema)