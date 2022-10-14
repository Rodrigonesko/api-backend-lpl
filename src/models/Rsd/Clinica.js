const mongoose = require('mongoose')

const clinicaScheema = mongoose.Schema({
    cnpj: String,
    descricao: String
})

module.exports = mongoose.model('Clinica', clinicaScheema)