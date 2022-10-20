const mongoose = require('mongoose')

const pedidoScheema = mongoose.Schema({
    numero: String,
    protocolo: String,
    valorApresentado: String,
    valorReembolsado: String,
    dataSla: String,
    ativo: Boolean,
    status: String,
    formaPagamento: String,
    irregular: Boolean,
    reconhece: Boolean,
    statusFinalizacao: String,
    cnpj: String,
    clinica: String,
    profissional: String,
    crm: String,
    nf: String,
    reapresentado: Boolean,
    semRetornoContato: Boolean,
    comprovanteNaoRecebido: Boolean,
    dataConclusao: Date
}, {
    timestamps: true
})

module.exports = mongoose.model('Pedido', pedidoScheema)

