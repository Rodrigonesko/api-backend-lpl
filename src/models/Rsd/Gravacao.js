const mongoose = require('mongoose')

const gravacaoScheema = mongoose.Schema({
    caminho: String,
    idUsuario: String,
    dataHora: String,
    arquivo: String,
    tipo: String,
    idPacote: String
}, {
    timestamps: true
})

module.exports = mongoose.model('Gravacao', gravacaoScheema)