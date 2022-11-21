const mongoose = require('mongoose')

const pedidoScheema = mongoose.Schema({
    numero: String,
    protocolo: String,
    pacote: String,
    valorApresentado: String,
    valorReembolsado: String,
    dataSolicitacao: Date,
    dataPagamento: Date,
    dataSla: Date,
    ativo: Boolean,
    status: String,
    statusPacote: String,
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
    dataConclusao: Date,
    analista: String,
    operador: String,
    dataStatus: String,
    pessoa: String,
    mo: String,
    statusPadraoAmil: String,
    statusGerencial: String,
    fase: String,
    contratoEmpresa: String,
    justificativa: String,
    dataSelo: Date,
    contato: String,
    prioridadeDossie: Boolean

}, {
    timestamps: true
})

module.exports = mongoose.model('Pedido', pedidoScheema)

