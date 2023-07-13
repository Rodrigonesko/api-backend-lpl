const mongoose = require('mongoose')

const scheme = mongoose.Schema({
    nome: String,
    versao: String,
    dataCriacao: String,
    arquivo: String,
    inativo: Boolean
}, {
    timestamps: true
})

module.exports = mongoose.model('Politica', scheme)