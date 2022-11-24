const mongoose = require('mongoose')

const cidsScheema = mongoose.Schema({
    subCategoria: String,
    descricao: String
})

module.exports = mongoose.model('Cid', cidsScheema)