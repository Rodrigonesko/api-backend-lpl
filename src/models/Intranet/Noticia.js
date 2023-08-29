const mongoose = require('mongoose')

const Scheema = new mongoose.Schema({
    titulo: String,
    conteudo: String,
    data: String,
    anexos: []
}, {
    timestamp: true
})

const Noticia = mongoose.model('Noticia', Scheema)

module.exports = Noticia