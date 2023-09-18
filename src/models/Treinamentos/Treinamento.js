const mongoose = require('mongoose')

const Scheema = new mongoose.Schema({
    nome: String,
    plataforma: String,
    link: String,
    prazo: String,
    observacoes: String,
    realizados: []
}, {
    timestamps: true
})

module.exports = mongoose.model('Treinamento', Scheema)