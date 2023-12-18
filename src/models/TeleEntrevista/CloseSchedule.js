const mongoose = require('mongoose')

const Scheema = new mongoose.Schema({
    analista: String,
    data: String,
    fechadoPor: String,
    motivo: String,
}, {
    timestamps: true
})

module.exports = mongoose.model('CloseSchedule', Scheema)