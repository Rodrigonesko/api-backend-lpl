const Patologia = require('../models/Patologias/Patologia')

module.exports = {

    create: async (req, res) => {
        try {

            const { obesidade, autismo, cronicos, observacoes, idCelula, celula } = req.body

            await Patologia.updateOne({
                idCelula,
                celula
            }, {
                obesidade,
                autismo,
                cronicos,
                observacoes,
                idCelula,
                celula
            }, {
                upsert: true
            })

            return res.json({
                msg: 'ok'
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    show: async (req, res) => {
        try {

            const result = await Patologia.find()

            return res.json(result)

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    showById: async (req, res) => {
        try {

            const { celula, idCelula } = req.params

            const result = await Patologia.findOne({
                idCelula,
                celula
            })

            return res.json(result)

            return res.json({
                msg: 'ok'
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    }
}