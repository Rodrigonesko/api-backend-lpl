const mongoose = require('mongoose')

const statusPedidoScheema = new mongoose.Schema({
    descricao: String,
    ativo: Boolean
})

module.exports = mongoose.model('StatusPedido', statusPedidoScheema)