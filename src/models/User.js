const mongoose = require('mongoose')

const userScheema = mongoose.Schema({
    name: String,
    email: String,
    password: String,
    accessLevel: String
},
{
    versionKey: false
})

module.exports = mongoose.model('User', userScheema)