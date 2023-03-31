const mongoose = require('mongoose')

const amilScheema = mongoose.Schema({
    reembolso: String,
    situacao: String,
    aguardandoDoc: String,
    dataPedido: String,
    dataPrevistaPagamento: String,
    dataPagamento: String,
    numeroTitulo: String,
    tipoTitulo: String,
    tipoCobranca: String,
    empresaEmitente: String,
    filial: String,
    nomeFavorecido: String,
    cpfFavorecido: String,
    beneficiario: String,
    valorApresentado: String,
    valorReembolsado: String,
    tipoEnvelope: String,
    numeroEnvelope: String,
    modalidade: String,
    origem: String,
    protocolo: String,
    grupoEncaminhamento: String,
    situacaoEncaminhamento: String,
    tipoComprovante: String,
    numeroReciboNota: String,
    linkNota: String,
    tipoContrato: String
}, {
    timestamps: true
})

module.exports = mongoose.model('Amil', amilScheema)