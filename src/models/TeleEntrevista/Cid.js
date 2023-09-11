const mongoose = require('mongoose')

const cidsScheema = new mongoose.Schema({
    subCategoria: String,
    descricao: String
})

module.exports = mongoose.model('Cid', cidsScheema)