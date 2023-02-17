const moment = require('moment')
const ControleAtividade = require('../models/ControleAtividade/ControleAtividade')
const User = require('../models/User')

module.exports = {
    atividadePadrao: async (req, res) => {
        try {
            const { name } = req.body

            const buscarAtividade = await User.findOne({
                name
            })

            const atividadePrincipal = buscarAtividade.atividadePrincipal

            const horarioSaida = buscarAtividade.horarioSaida2

            const find = await ControleAtividade.findOne({
                data: moment().format('YYYY-MM-DD'),
                analista: name
            })

            const diaAnterior = await ControleAtividade.findOne({
                data: { $ne: moment().format('YYYY-MM-DD') },
                analista: name,
                encerrado: false
            })

            if (diaAnterior) {

                const dataInicio = moment(diaAnterior.horarioInicio)
                const dataFim = moment(`${diaAnterior.data} ${horarioSaida}`)
        
                let ms = moment(dataFim).diff(moment(dataInicio))
                let d = moment.duration(ms);
                let s = Math.floor(d.asHours()) + moment.utc(ms).format(":mm:ss");

                const encerrar = await ControleAtividade.findByIdAndUpdate({
                    _id: diaAnterior._id
                }, {
                    encerrado: true,
                    horarioFim: moment(dataFim).format('YYYY-MM-DD HH:mm:ss'),
                    totalHoras: s
                })

            }

            if (find) {
                return res.status(200).json({
                    msg: 'Dia já iniciado'
                })
            }

            const create = await ControleAtividade.create({
                analista: name,
                atividade: atividadePrincipal,
                horarioInicio: moment().format('YYYY-MM-DD HH:mm:ss'),
                data: moment().format('YYYY-MM-DD'),
                mes: moment().format('MM/YYYY'),
                encerrado: false
            })

            return res.status(200).json({
                create
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },
    atividadesAndamento: async (req, res) => {
        try {

            const atividades = [
                'Gerência',
                'Sistemas',
                'Elegibilidade',
                'RSD',
                'Sindicância',
                'Tele Entrevista',
                'Callback',
                'Ti/Infra'
            ]

            let report = []

            for (const atividade of atividades) {
                const result = await ControleAtividade.find({
                    data: moment().format('YYYY-MM-DD'),
                    encerrado: false,
                    atividade: atividade
                })

                let analistas = []

                const count = result.length

                result.forEach(item => {
                    analistas.push(item.analista)
                })

                report.push({
                    celula: atividade,
                    quantidade: count,
                    analistas: analistas
                })
            }

            return res.status(200).json({
                report
            })


        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },
    atividadeAtual: async (req, res) => {
        try {

            const atividadeAtual = await ControleAtividade.findOne({
                analista: req.user,
                data: moment().format('YYYY-MM-DD'),
                encerrado: false
            })

            if (atividadeAtual) {
                return res.status(200).json({
                    atividade: atividadeAtual.atividade
                })
            }

            return res.status(200).json({
                atividade: 'Nenhuma'
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },
    assumirAtividade: async (req, res) => {
        try {

            const { atividade } = req.body

            const create = await ControleAtividade.create({
                analista: req.user,
                atividade: atividade,
                horarioInicio: moment().format('YYYY-MM-DD HH:mm:ss'),
                data: moment().format('YYYY-MM-DD'),
                mes: moment().format('MM/YYYY'),
                encerrado: false
            })

            return res.status(200).json({
                create
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },
    encerrarAtividade: async (req, res) => {
        try {

            const result = await ControleAtividade.findOne({
                analista: req.user,
                data: moment().format('YYYY-MM-DD'),
                encerrado: false
            })

            const dataInicio = moment(result.horarioInicio)
            const dataFim = moment()

            let ms = moment(dataFim).diff(moment(dataInicio))
            let d = moment.duration(ms);
            let s = Math.floor(d.asHours()) + moment.utc(ms).format(":mm:ss");

            const encerrarAtividade = await ControleAtividade.findByIdAndUpdate({
                _id: result._id
            }, {
                encerrado: true,
                horarioFim: moment(dataFim).format('YYYY-MM-DD HH:mm:ss'),
                totalHoras: s
            })

            return res.status(200).json({
                encerrarAtividade
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },
    report: async (req, res) => {
        try {

            const report = await ControleAtividade.find({
                encerrado: true
            })

            return res.status(200).json({
                report
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    }
}