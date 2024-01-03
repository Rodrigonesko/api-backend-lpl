const TaskRequest = require('../models/Chamados/TaskRequest')
const User = require('../models/User/User')
const moment = require('moment')
const nodemailer = require('nodemailer')

module.exports = {

    findAll: async (req, res) => {
        try {
            const encontrarTodos = await TaskRequest.find({
            }).sort({ createdAt: -1 })
            return res.status(200).json({
                encontrarTodos
            })
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    setStatus: async (req, res) => {
        try {
            const resultado = await TaskRequest.updateOne({ _id: req.body._id }, { status: req.body.status })

            if (req.body.status === 'finalizado') {
                const result = await TaskRequest.updateOne({ _id: req.body._id }, { dataFinalizado: moment().format('YYYY-MM-DD') })
                console.log(result);
            } else if (req.body.status === 'tratando' || req.body.status === 'verificado') {
                const result = await TaskRequest.updateOne({ _id: req.body._id }, { dataFinalizado: '' })
                console.log(result);
            }

            return res.status(200).json({
                msg: resultado
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    setAnalist: async (req, res) => {
        try {
            const resultado = await TaskRequest.updateOne({ _id: req.body._id }, { analista: req.body.analista })
            return res.status(200).json({
                msg: resultado
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    setRetorno: async (req, res) => {
        try {
            const resultado = await TaskRequest.updateOne({ _id: req.body._id }, { retorno: req.body.retorno })

            console.log(resultado)
            console.log(req.body)
            return res.status(200).json({
                msg: 'OK'
            })


        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    createTaskRequest: async (req, res) => {
        try {
            //Crie uma solicitação
            const body = req.body

            console.log(req.user);

            const find = await User.findOne({
                $or: [
                    { nomeCompleto: req.user },
                    { name: req.user }
                ]
            })

            const findActivity = await User.findOne({ name: req.user })

            const criarRequisicao = await TaskRequest.create({
                dataInicio: moment().format('YYYY-MM-DD'),
                colaborador: req.user,
                setor: findActivity.atividadePrincipal,
                assunto: body.assunto,
                descricao: body.descricao,
                dataFinalizado: body.dataFinalizado,
                analista: body.analista,
                status: body.status,
                retorno: body.retorno
            })

            if (criarRequisicao) {
                let transporter = nodemailer.createTransport({
                    host: "email-ssl.com.br",
                    port: 465,
                    secure: true,
                    auth: {
                        user: process.env.EMAIL,
                        pass: process.env.PASSWORD,
                    }
                })

                transporter.sendMail({
                    from: `Leonardo Lonque <${process.env.EMAIL}>`,
                    to: "rodrigo.dias@lplseguros.com.br, leonardo.lonque@lplseguros.com.br",
                    subject: body.assunto,
                    text: body.descricao,
                }).then(message => {
                    console.log(message);
                }).catch(err => {
                    console.log(err);
                })
            }

            return res.json({
                msg: 'OK'
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    getCadastroByFilter: async (req, res) => {
        try {

            const { colaborador } = req.query
            const { analista } = req.query

            console.log(req.query);

            const result = await TaskRequest.find({

                colaborador: { $regex: colaborador },
                analista: { $regex: analista }
            })

            console.log(result);

            return res.json(result)

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },
}
