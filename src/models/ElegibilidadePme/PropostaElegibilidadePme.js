const mongoose = require('mongoose')

const propostaScheema = mongoose.Schema({
    porte: String,
    linhaDeProduto: String,
    grupo: String,
    cnpj: String,
    proposta: String,
    vidas: String,
    colaborador: String,
    situacao: String,
    dataProtocolo: String,
    dataAnalise: String,
    observacoes: String,
    motor: String,
    gestor: String,
    analista: String,
    dataRecebimento: String,
    dataConclusao: String,
    status: String
}, {
    timestamps: true
})

module.exports = mongoose.model('PropostaElegibilidadePme', propostaScheema)