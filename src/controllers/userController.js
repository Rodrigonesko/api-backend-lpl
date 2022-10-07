const mongoose = require('mongoose')
const User = mongoose.model('User')
const bcrypt = require('bcrypt')
const nodemailer = require('nodemailer')

module.exports = {

    create: async (req, res) => {
        try {

            const { email, name, password, confirmPassword, accessLevel } = req.body

            const user = await User.findOne({ email })

            if (user) {
                return res.status(422).json({ message: `O email ${email} ja foi registrado` })
            }

            if (password !== confirmPassword) {
                return res.status(401).json({ message: `As senhas não conferem` })
            }

            const encryptedPassword = await bcrypt.hash(password, 8)

            const newUser = await User.create({
                email,
                name,
                password: encryptedPassword,
                accessLevel,
                firstAccess: 'Sim'
            })

            // let transport = nodemailer.createTransport({
            //     host: "smtp.mailtrap.io",
            //     port: 2525,
            //     auth: {
            //         user: "9e7654d26f444b",
            //         pass: "fbc1e9727d438a"
            //     }
            // })

            // let message = {
            //     from: "rodrigoonesko@gmail.com",
            //     to: "rodrigo_onesko@hotmail.com",
            //     subject: "Message title",
            //     text: "Plaintext version of the message",
            //     html: "<p>HTML version of the message</p>"
            // }

            // const testEmail = await transport.sendMail(message)

            // console.log(testEmail);


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
            const {email} = req.params

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

            const { email, liminares, liminaresAj, enfermeiro, elegibilidade } = req.body

            const result = await User.findOneAndUpdate({email: email}, {
                liminares: liminares,
                liminaresAj: liminaresAj,
                enfermeiro: enfermeiro,
                elegibilidade: elegibilidade
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
    }

}