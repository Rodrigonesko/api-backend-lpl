const mongoose = require('mongoose')

const projetoAjScheema = mongoose.Schema({
    analista: String,
    beneficiario: String,
    dataConclusao: Date,
    mo: String,
    situacao: String,
    idLiminar: String,
    dataVigencia: Date
}, {
    timeStamps: true
})

module.exports = mongoose.model('ProjetoAj', projetoAjScheema)