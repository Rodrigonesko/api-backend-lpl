const { default: mongoose } = require("mongoose");
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
                const nextDate = moment(dataInicio).add(condicao.dias * index, condicao.unidade);
                if ((quantidadeRepeticao === 'diario') && (!nextDate.day() || nextDate.day() === 6)) { // Ignora dias de fim de semana (domingo ou sábado)
                    continue;
                }
                agendas.push({
                    _id: mongoose.Types.ObjectId(),
                    data: nextDate.format('YYYY-MM-DD'),
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
                    if ((notes.nome === req.user) && (itens.data <= moment().format('YYYY-MM-DD')) && (itens.concluido === false)) {
                        find.push({
                            _id: itens._id,
                            nome: notes.nome,
                            descricao: notes.descricao,
                            data: itens.data,
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
            const { _id } = req.body

            console.log(req.body)

            const result = await Agenda.updateOne({
                'proximasDatas._id': mongoose.Types.ObjectId(_id),
            }, {
                $set: { 'proximasDatas.$.concluido': true, }
            })

            console.log(mongoose.Types.ObjectId(_id));
            console.log(result);

            return res.status(200).json({
                msg: 'ok'
            })
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error',
                error
            })
        }
    },

    setData: async (req, res) => {
        try {

            const { data, _id } = req.body

            console.log(req.body);

            const update = await Agenda.updateOne({
                'proximasDatas._id': mongoose.Types.ObjectId(_id)
            }, {
                $set: { 'proximasDatas.$.data': data, }
            })
            console.log(update);

            return res.status(200).json(update)
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },
}