const Treinamento = require('../models/Treinamentos/Treinamento')
const User = require('../models/User/User')
const moment = require('moment')

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

            const users = await User.find()

            const realizados = users.map(user => {
                return {
                    nome: user.name,
                    realizado: false,
                    id: user._id,
                    data: null
                }
            })

            await Treinamento.create({
                nome,
                plataforma,
                link,
                prazo,
                observacoes,
                realizados
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

            const { idTreinamento, nome } = req.body

            await Treinamento.updateOne({
                _id: idTreinamento,
                "realizados.nome": nome
            }, {
                $set: {
                    'realizados.$.realizado': true,
                    'realizados.$.data': moment().format('YYYY-MM-DD'),
                }
            })

            await User.updateOne({
                name: nome
            }, {
                $push: {
                    treinamentos: idTreinamento
                }
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

    naoPrecisaTreinamento: async (req, res) => {
        try {

            const { idTreinamento, nome } = req.body

            const result = await Treinamento.updateOne({
                _id: idTreinamento,
            }, {
                $pull: {
                    realizados: { nome }
                }
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

    verificarTreinamento: async (req, res) => {
        try {

            const treinamentos = await Treinamento.find({
                "realizados.nome": req.user,
            }, {
                "realizados.$": 1,
                nome: 1,
                plataforma: 1,
                link: 1,
                prazo: 1,
                observacoes: 1
            })

            const treinamentosNaoRealizados = treinamentos.filter(treinamento => {
                return !treinamento.realizados[0].realizado
            })

            return res.json(treinamentosNaoRealizados)

        } catch (error) {
            console.log('error')
            return res.json({
                msg: 'Internal Server Error',
                error
            })
        }
    }

}