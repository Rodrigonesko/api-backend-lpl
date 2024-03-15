const Agenda = require("../models/Agenda/Agenda")
const User = require("../models/User/User")
const moment = require('moment');

module.exports = {

    createAgenda: async (req, res) => {
        try {

            const { nome, quantidadeRepeticao, dataInicio, descricao } = req.body

            // console.log(req.body);

            let agendas = []

            let condicao = {
                dias: 1,
                unidade: 'day'
            }

            switch (quantidadeRepeticao) {
                case "semanal":
                    condicao.dias = 7
                    condicao.unidade = 'days'
                    break
                case "quinzenal":
                    condicao.dias = 15
                    condicao.unidade = 'days'
                    break
                case "mensal":
                    condicao.dias = 1
                    condicao.unidade = 'month'
                    break
                case "trimestral":
                    condicao.dias = 3
                    condicao.unidade = 'months'
                    break
                case "semestral":
                    condicao.dias = 6
                    condicao.unidade = 'months'
                    break
                case "anual":
                    condicao.dias = 1
                    condicao.unidade = 'year'
                    break
            }

            for (let index = 0; index < 100; index++) {
                agendas.push({
                    data: moment(dataInicio).add(condicao.dias * index, condicao.unidade).format('YYYY-MM-DD'),
                    concluido: false
                })
            }

            console.log(agendas);

            const create = await Agenda.create({
                nome,
                quantidadeRepeticao,
                dataInicio,
                descricao,
                proximasDatas: agendas,
            })

            return res.status(200).json({
                create
            })
        } catch (error) {
            console.log(error)
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    getAgenda: async (req, res) => {
        try {
            const find = await Agenda.find()

            return res.status(200).json(find)
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    getAgendaToDo: async (req, res) => {
        try {
            const agenda = await Agenda.find()

            const find = []

            for (const notes of agenda) {
                for (const itens of notes.proximasDatas) {
                    // console.log(notes.nome);
                    if ((notes.nome === req.user) && (itens.data === moment().format('YYYY-MM-DD')) && (itens.concluido === false)) {
                        find.push({
                            nome: notes.nome,
                            descricao: notes.descricao,
                            concluido: false,
                        })
                    }
                }
            }

            return res.status(200).json(find)
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    deleteAgenda: async (req, res) => {
        try {
            const { id } = req.params

            if (!id) {
                return res.status(400).json({
                    msg: 'ID obrigatório'
                })
            }

            await Agenda.deleteOne({
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

    updateAgendaCheck: async (req, res) => {
        try {
            const { _id, data } = req.body

            console.log(req.body)

            const result = await Agenda.updateOne({
                _id: _id,
                "proximasDatas.$.data": data
            }, {
                $set: {
                    'proximasDatas.$.concluido': true,
                }
            })

            return res.status(200).json(result)
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error',
                error
            })
        }
    },
}