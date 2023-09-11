const mongoose = require('mongoose')

const scheme = new mongoose.Schema({
    obesidade: Boolean,
    autismo: Boolean,
    cronicos: Boolean,
    observacoes: String,
    idCelula: String,
    celula: String
}, {
    timestamps: true
})

module.exports = mongoose.model('Patologia', scheme)