const mongoose = require('mongoose')

const PlanoPfSchema = new mongoose.Schema({
    nome: String,
    dataVigencia: String,
    codigo: String,
    prazo: String

}, {
    timestamps: true
})

module.exports = mongoose.model('PlanoPf', PlanoPfSchema)