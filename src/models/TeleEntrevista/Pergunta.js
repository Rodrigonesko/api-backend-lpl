const mongoose = require('mongoose')

const perguntasScheema = new mongoose.Schema({
    pergunta: String,
    formulario: String,
    categoria: String,
    divergencia: String,
    existeSub: Boolean,
    subPerguntasSim: [],
    subPerguntasNao: [],
    name: String,
    sexo: String

})

module.exports = mongoose.model('Pergunta', perguntasScheema)