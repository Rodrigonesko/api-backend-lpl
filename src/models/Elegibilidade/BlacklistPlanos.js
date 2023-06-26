const mongoose = require('mongoose')

const scheema = mongoose.Schema({
    plano: String
}, {
    timestamps: true
})

module.exports = mongoose.model('BlacklistPlano', scheema)