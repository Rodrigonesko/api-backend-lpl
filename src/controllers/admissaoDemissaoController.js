const AdmissaoDemissao = require('../models/AdmissaoDemissao/AdmissaoDemissao')
const User = require('../models/User/User')

module.exports = {

    findAll: async (req, res) => {
        try {
            const encontrarTodos = await AdmissaoDemissao.find({
            })

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
            const result = await AdmissaoDemissao.updateOne({ _id: req.body._id }, { status: req.body.status })
            return res.status(200).json({
                msg: result
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    setNumero: async (req, res) => {
        try {
            const result = await AdmissaoDemissao.updateOne({ _id: req.body._id }, { numero: req.body.numero })
            return res.status(200).json({
                msg: result
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    createNewAdmissao: async (req, res) => {
        try {
            const body = req.body
            await AdmissaoDemissao.create({
                nome: body.nome,
                numero: body.numero,
                email: body.email,
                observacao: body.observacao,
                status: body.status,
                data: body.data,
            })
            return res.status(200).json({ message: 'Requisição criada com sucesso.' })
        } catch (error) {
            console.log(error);
            return res.status(500).json({ error: "Internal server error." })
        }
    },

    infoUser: async (req, res) => {
        try {

            const user = await AdmissaoDemissao.findOne({ nomeCompleto: req.name })

            return res.status(200).json({
                user
            })

        } catch (error) {
            console.error(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    searchName: async (req, res) => {
        try {
            const { nome } = req.params
            const user = await AdmissaoDemissao.findOne({ nome: { $regex: new RegExp(nome, 'i') } })

            return res.status(200).json({ user })
        } catch (error) {
            return res.status(500).json({ error: "Internal server error.", error })
        }
    },
}