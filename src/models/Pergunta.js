const mongoose = require('mongoose')

const perguntasScheema = mongoose.Schema({
    pergunta: String,
    formulario: String,
    categoria: String,
    divergencia: String,
    existeSub: Boolean,
    subPerguntasSim: [],
    subPerguntasNao: [],
    name: String

})

module.exports = mongoose.model('Pergunta', perguntasScheema)