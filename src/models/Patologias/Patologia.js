const mongoose = require('mongoose')

const scheme = mongoose.Schema({
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