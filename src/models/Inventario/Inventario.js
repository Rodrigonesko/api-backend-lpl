const mongoose = require('mongoose')

const Scheema = new mongoose.Schema({
    nome: String,
    etiqueta: String,
    ondeEsta: String,
    descricao: String,
    emUso: Boolean,
    emEstoque: Boolean,
    descontinuado: Boolean,
    status: String


}, {
    timestamps: true
})

const inventario = mongoose.model('inventario', Scheema)

module.exports = inventario