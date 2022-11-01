const mongoose = require('mongoose')

const gravacaoScheema = mongoose.Schema({
    caminho: String,
    usuario: String,
    arquivo: String,
    tipo: String,
    pacote: String
}, {
    timestamps: true
})

module.exports = mongoose.model('Gravacao', gravacaoScheema)