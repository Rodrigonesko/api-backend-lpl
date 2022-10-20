const mongoose = require('mongoose')

const statusPedidoScheema = mongoose.Schema({
    descricao: String,
    ativo: Boolean
})

module.exports = mongoose.model('StatusPedido', statusPedidoScheema)