const mongoose = require('mongoose')

const pedidoScheema = mongoose.Schema({
    numero: String,
    idProtocolo: String,
    valorApresentado: String,
    valorReembolsado: String,
    dataSla: String,
    ativo: Boolean,
    idStatus: String,
    cnpj: String,
    clinica: String,
    profissional: String,
    crm: String,
    nf: String,
    reapresentado: Boolean,
    semRetornoContato: Boolean,
    comprovanteNaoRecebido: Boolean,
    dataCadastro: Date,
    dataConclusao: Date
}, {
    timestamps: true
})

module.exports = mongoose.model('Pedido', pedidoScheema)

