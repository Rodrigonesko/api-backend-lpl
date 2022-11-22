const mongoose = require('mongoose')

const perguntasScheema = mongoose.Schema({
    pergunta: String,
    formulario: String,
    categoria: String,
    divergencia: String,
    subPergunta: Boolean,
    subPerguntaQual: String
})

module.exports = mongoose.model('Pergunta', perguntasScheema)