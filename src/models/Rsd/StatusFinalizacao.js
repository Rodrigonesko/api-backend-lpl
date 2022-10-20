const mongoose = require('mongoose')

const statusFinalizacaoScheema = mongoose.Schema({
    descricao: String
}, {
    timestamps: true
})

module.exports = mongoose.model('StatusFinalizacao', statusFinalizacaoScheema)