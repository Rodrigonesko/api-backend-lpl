const mongoose = require('mongoose')

const OperadorScheema = new mongoose.Schema({
    descricao: String,
    sla: String,
    ativo: Boolean
})

module.exports = mongoose.model('Operador', OperadorScheema)