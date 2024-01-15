const mongoose = require('mongoose');

const Scheema = new mongoose.Schema({
   nome: String,
   acao: String,
   data: String
}, {
    timestamps: true
});

const Log = mongoose.model('LogTele', Scheema);

module.exports = Log;