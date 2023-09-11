const mongoose = require('mongoose')

const formaPagamento = new mongoose.Schema({
    nome: String
})

module.exports = mongoose.model('FormaPagamento', formaPagamento)