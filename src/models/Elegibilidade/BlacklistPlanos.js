const mongoose = require('mongoose')

const scheema = new mongoose.Schema({
    plano: String
}, {
    timestamps: true
})

module.exports = mongoose.model('BlacklistPlano', scheema)