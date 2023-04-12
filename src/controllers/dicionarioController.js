const Dicionario = require('../models/Dicionario/Dicionario')

module.exports = {

    show: async (req, res) => {
        try {

            const palavras = await Dicionario.find()

            return res.json(palavras)

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    create: async (req, res) => {
        try {

            const { palavra } = req.body

            if (palavra === '') {
                return res.status(400).json({
                    msg: 'palavra em branco'
                })
            }

            const result = await Dicionario.findOne({
                palavra
            })

            if (result) {
                return res.status(400).json({
                    msg: 'Palavra ja existente no dicionário'
                })
            }

            await Dicionario.create({
                palavra
            })

            return res.status(200).json({
                msg: 'Palavra adicionada'
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    delete: async (req, res) => {
        try {

            const { palavra } = req.params

            await Dicionario.deleteOne({
                palavra
            })

            return res.status(200).json({
                msg: 'Palavra excluida com sucesso'
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    }

}