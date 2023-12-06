const mongoose = require('mongoose')

const userScheema = new mongoose.Schema({
    toDo: [],
    nome: String,
    dataConclusao: String,
    tarefa: String,
    tipoCriacao: String,

},
    {
        versionKey: false
    })

module.exports = mongoose.model('toDo', userScheema)