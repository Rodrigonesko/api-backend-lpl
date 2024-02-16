const mongoose = require('mongoose')

const Scheema = new mongoose.Schema({
    analista: String,
    data: String,
}, {
    timestamps: true
})

module.exports = mongoose.model('NextCloseSchedule', Scheema)