const mongoose = require('mongoose')

const cancelamentosScheema = mongoose.Schema({
    descricao: String
})

module.exports = mongoose.model('CancelamentoMotivo', cancelamentosScheema)