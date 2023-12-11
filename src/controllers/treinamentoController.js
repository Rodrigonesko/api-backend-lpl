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
            if (nome === '' || plataforma === '' || prazo === '') {
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
                    data: null,
                    ativo: true
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
            //Rota para editar infos

            const { nome, plataforma, link, prazo, observacoes } = req.body

            if (nome === '' || plataforma === '' || prazo === '') {
                return res.status(400).json({
                    msg: 'Alguma informação está em branco'
                })
            }

            await Treinamento.updateOne({ _id: req.body.id }, {
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

            const { idTreinamento, nome, data } = req.body

            await Treinamento.updateOne({
                _id: idTreinamento,
                "realizados.nome": nome
            }, {
                $set: {
                    'realizados.$.realizado': true,
                    'realizados.$.data': data,
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

            const { idTreinamento, nome, ativo } = req.body

            const result = await Treinamento.updateOne({
                _id: idTreinamento,
                "realizados.nome": nome
            }, {
                $set: {
                    'realizados.$.ativo': !ativo,
                }
            })

            console.log(result);
            console.log(ativo);

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
                return !treinamento.realizados[0].realizado && treinamento.realizados[0].ativo
            })

            return res.json(treinamentosNaoRealizados)

        } catch (error) {
            console.log('error')
            return res.json({
                msg: 'Internal Server Error',
                error
            })
        }
    },

    adicionarUsuarioNoTreinamento: async (req, res) => {
        try {

            const { idTreinamento, nome } = req.body

            const treinamento = await Treinamento.findOne({
                _id: idTreinamento
            })

            const user = await User.findOne({
                name: nome
            })

            const treinamentoJaExiste = treinamento.realizados.filter(user => {
                return user.nome === nome
            })

            if (treinamentoJaExiste.length > 0) {
                return res.json({
                    msg: 'Usuário já existe no treinamento'
                })
            }

            const novoUsuario = {
                nome: user.name,
                realizado: false,
                id: user._id,
                data: null,
                ativo: true
            }

            await Treinamento.updateOne({
                _id: idTreinamento
            }, {
                $push: {
                    realizados: novoUsuario
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

    }

}