const mongoose = require('mongoose')

const cancelamentosScheema = new mongoose.Schema({
    descricao: String
})

module.exports = mongoose.model('CancelamentoMotivo', cancelamentosScheema)