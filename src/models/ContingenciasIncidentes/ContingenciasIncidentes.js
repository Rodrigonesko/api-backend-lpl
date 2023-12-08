const mongoose = require('mongoose')

const scheme = new mongoose.Schema({
    nome: String,
    versao: String,
    dataCriacao: String,
    arquivo: String,
    inativo: Boolean,
    assinaturas: []
}, {
    timestamps: true
})

module.exports = mongoose.model('ContingenciaIncidentes', scheme)