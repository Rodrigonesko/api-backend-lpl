const mongoose = require('mongoose')

const formaPagamento = mongoose.Schema({
    nome: String
})

module.exports = mongoose.model('FormaPagamento', formaPagamento)