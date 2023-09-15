const mongoose = require('mongoose')
const User = mongoose.model('User')
const Celula = require('../models/User/Celula')
const bcrypt = require('bcrypt')

module.exports = {

    create: async (req, res) => {
        try {

            const { email, name, accessLevel, atividade } = req.body

            const user = await User.findOne({ email })

            if (user) {
                return res.status(422).json({ message: `O email ${email} ja foi registrado` })
            }

            const encryptedPassword = await bcrypt.hash('123', 8)

            const newUser = await User.create({
                email,
                name,
                password: encryptedPassword,
                accessLevel,
                firstAccess: 'Sim',
                atividadePrincipal: atividade
            })

            return res.status(201).json(newUser)

        } catch (error) {
            console.error(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },
    index: async (req, res) => {
        try {
            const users = await User.find()

            users.forEach(e => {
                console.log(e.name);
            })

            return res.json(users)
        } catch (error) {
            console.error(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },
    infoUser: async (req, res) => {
        try {

            const user = await User.findOne({ email: req.email })

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
    firstAccess: async (req, res) => {
        try {

            const { password, confirmPassword } = req.body

            if (password !== confirmPassword) {
                return res.status(401).json({ message: `As senhas não conferem` })
            }

            console.log(req.email);

            const encryptedPassword = await bcrypt.hash(password, 8)

            const updatePass = await User.findOneAndUpdate({
                email: req.email
            }, {
                password: encryptedPassword,
                firstAccess: 'Não'
            })

            return res.status(200).json({
                message: 'A senha foi atualizada com sucesso!',
                updatePass
            })


        } catch (error) {
            console.error(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },
    searchEmail: async (req, res) => {
        try {
            const { email } = req.params

            console.log(email);

            const user = await User.findOne({ email: email })

            return res.status(200).json({
                user
            })
        } catch (error) {
            return res.status(500).json({
                error: "Internal server error.",
                error
            })
        }
    },
    modules: async (req, res) => {
        try {

            const { email, enfermeiro, elegibilidade, entrada1, saida1, entrada2, saida2, atividadePrincipal, coren, rsd } = req.body

            console.log(entrada1, saida1, entrada2, saida2, coren);

            const result = await User.findOneAndUpdate({ email: email }, {
                enfermeiro: enfermeiro,
                elegibilidade: elegibilidade,
                horarioEntrada1: entrada1,
                horarioSaida1: saida1,
                horarioEntrada2: entrada2,
                horarioSaida2: saida2,
                rsd,
                atividadePrincipal,
                coren
            })

            return res.status(200).json({
                result
            })

        } catch (error) {
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },
    enfermeiros: async (req, res) => {
        try {
            const enfermeiros = await User.find({
                enfermeiro: 'true'
            })

            return res.status(200).json({
                enfermeiros
            })
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },
    analistasElegi: async (req, res) => {
        try {
            const analistas = await User.find({
                elegibilidade: 'true'
            })

            return res.status(200).json({
                analistas
            })
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    analistasRsd: async (req, res) => {
        try {

            const analistas = await User.find({
                rsd: true
            })

            return res.json(analistas)

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    resetPassword: async (req, res) => {
        try {

            const { email } = req.body

            const encryptedPassword = await bcrypt.hash('123', 8)

            const update = await User.updateOne({
                email
            }, {
                password: encryptedPassword,
                firstAccess: 'Sim'
            })

            return res.status(200).json({
                update
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    coren: async (req, res) => {
        try {

            const { name } = req.params

            const result = await User.findOne({
                name
            })

            const coren = result.coren

            return res.json(coren)

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    lerPolitica: async (req, res) => {
        try {

            const { id } = req.body

            await User.updateOne({
                name: req.user
            }, {
                $push: { politicasLidas: id }
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

    getAllCelulas: async (req, res) => {
        try {
            const result = await Celula.find()
            return res.json(result)
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    createCelula: async (req, res) => {
        try {
            const { celula } = req.body
            await Celula.create({
                celula
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

    deleteCelula: async (req, res) => {
        try {
            const { celula } = req.params
            await Celula.deleteOne({
                celula
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
    }
}