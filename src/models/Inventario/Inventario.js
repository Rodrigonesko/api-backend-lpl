const mongoose = require('mongoose')

const Scheema = new mongoose.Schema({
    nome: String,
    etiqueta: String,
    ondeEsta: String,
    descricao: String,
    status: {
        type: String,
        enum: ['emUso', 'emEstoque', 'descontinuado'],
        default: 'emEstoque',
    },
    serial: String,
    dataDeCompra: String,
    tempoGarantia: String,
    dataGarantia: String,
    nf: String,
    anexado: Boolean,

}, {
    timestamps: true
})

const inventario = mongoose.model('inventario', Scheema)

module.exports = inventario