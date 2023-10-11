const mongoose = require('mongoose')

const scheme = new mongoose.Schema({
    arquivos: [],
    texto: String,
    responsavel: String
}, {
    timestamps: true
})

module.exports = mongoose.model('Recado', scheme)