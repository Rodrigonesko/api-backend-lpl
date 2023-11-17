const mongoose = require('mongoose')

const Scheema = new mongoose.Schema({
    nome: String,
    numero: String,
    email: String,
    observacao: String,
    status: String,
    pendente: Boolean,
    emAndamento: Boolean,
    concluido: Boolean,
    realizado: Boolean,
    data: String,
}, {
    timestamps: true
})

const AdmissaoDemissao = mongoose.model('AdmissaoDemissao', Scheema)

module.exports = AdmissaoDemissao