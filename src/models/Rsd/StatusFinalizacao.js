const mongoose = require('mongoose')

const statusFinalizacaoScheema = new mongoose.Schema({
    descricao: String
}, {
    timestamps: true
})

module.exports = mongoose.model('StatusFinalizacao', statusFinalizacaoScheema)