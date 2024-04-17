const mongoose = require('mongoose')

/*To do
 Ajustar a model
 colocar enums
 retirar o que não é necessário
 deixar campos obigatórios
 */

const Scheema = new mongoose.Schema({
    nome: String,
    etiqueta: String,
    ondeEsta: String,
    descricao: String,
    emUso: Boolean,
    emEstoque: Boolean,
    descontinuado: Boolean,
    status: String,
    page: String,
    limit: String,

}, {
    timestamps: true
})

const inventario = mongoose.model('inventario', Scheema)

module.exports = inventario