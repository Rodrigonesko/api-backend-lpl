const Treinamento = require('../models/Treinamentos/Treinamento')
const User = require('../models/User/User')

module.exports = {

    getAll: async (req, res) => {
        try {

            const result = await Treinamento.find()

            return res.json(result)

        } catch (error) {
            console.log('error')
            return res.json({
                msg: 'Internal Server Error',
                error
            })
        }
    },

    create: async (req, res) => {
        try {

            const { nome, plataforma, link, prazo, observacoes } = req.body

            if (nome === '' || plataforma === '' || link === '' || prazo === '') {
                return res.status(400).json({
                    msg: 'Alguma informação está em branco'
                })
            }

            await Treinamento.create({
                nome,
                plataforma,
                link,
                prazo,
                observacoes
            })

            return res.json({
                msg: 'ok'
            })

        } catch (error) {
            console.log('error')
            return res.json({
                msg: 'Internal Server Error',
                error
            })
        }
    },

    update: async (req, res) => {
        try {

            const { nome, plataforma, link, prazo, id } = req.body

            if (nome === '' || plataforma === '' || link === '' || prazo === '' || id === '') {
                return res.status(400).json({
                    msg: 'Alguma informação está em branco'
                })
            }

            await Treinamento.updateOne({
                _id: id
            }, {
                nome,
                plataforma,
                link,
                prazo
            })

            return res.json({
                msg: 'ok'
            })

        } catch (error) {
            console.log('error')
            return res.json({
                msg: 'Internal Server Error',
                error
            })
        }
    },

    delete: async (req, res) => {
        try {

            const { id } = req.params

            if (!id) {
                return res.status(400).json({
                    msg: 'ID obrigatório'
                })
            }

            await Treinamento.deleteOne({
                _id: id
            })

            return res.json({
                msg: 'ok'
            })

        } catch (error) {
            console.log('error')
            return res.json({
                msg: 'Internal Server Error',
                error
            })
        }
    },

    getById: async (req, res) => {
        try {

            const { id } = req.params

            if (!id) {
                return res.status(400).json({
                    msg: 'ID obrigatório'
                })
            }

            const result = await Treinamento.findOne({
                _id: id
            })

            return res.json(result)

        } catch (error) {
            console.log('error')
            return res.json({
                msg: 'Internal Server Error',
                error
            })
        }
    },

    treinamentoRealizado: async (req, res) => {
        try {

            return res.json({
                msg: 'ok'
            })

        } catch (error) {
            console.log('error')
            return res.json({
                msg: 'Internal Server Error',
                error
            })
        }
    }

}