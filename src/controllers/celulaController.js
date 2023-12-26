const Celula = require('../models/User/Celula')

module.exports = {
    create: async (req, res) => {
        const { celula } = req.body
        const newCelula = new Celula({ celula })
        await newCelula.save()
        return res.json(newCelula)
    },

    show: async (req, res) => {
        const celulas = await Celula.find()
        return res.json(celulas)
    }
}