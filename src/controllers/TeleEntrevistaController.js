mongoose = require('mongoose')
const Pergunta = mongoose.model('Pergunta')
const Propostas = mongoose.model('PropostaEntrevista')
const Cid = mongoose.model('Cid')
const DadosEntrevista = mongoose.model('DadosEntrevista')

const path = require('path')
const moment = require('moment')
const fs = require('fs')
const multer = require('multer')
const os = require('os')
const xlsx = require('xlsx')

const uploadCid = multer({ dest: os.tmpdir() }).single('file')

module.exports = {
    mostrarPerguntas: async (req, res) => {
        try {

            const perguntas = await Pergunta.find()

            return res.status(200).json({
                perguntas
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    mostrarPessoaEntrevista: async (req, res) => {
        try {

            const { id } = req.params

            const pessoa = await Propostas.findById({
                _id: id
            })

            return res.status(200).json({
                pessoa
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    enviarDadosFormulario: async (req, res) => {
        try {

            const { respostas, subRespostas, pessoa, simOuNao, cids } = req.body

            console.log(simOuNao);

            let respostasConc = {

            }

            Object.keys(simOuNao).forEach(key => {
                respostasConc[`${key}`] += `\n ${simOuNao[key]}`
            })


            Object.keys(subRespostas).forEach(key => {
                let split = key.split('-')

                respostasConc[`${split[0]}`] += ` \n ${split[1]} ${subRespostas[key]}`

            })

            Object.keys(respostas).forEach(key => {
                respostasConc[`${key}`] += `\n ${respostas[key]}`
            })

            const addDadosEntrevistas = await Promise.all(Object.keys(respostasConc)).map(async key => {
                return await DadosEntrevista.findOneAndUpdate({
                    
                }, {
                    key: respostasConc[key]
                }, {
                    upsert: true
                })
            })

            return res.status(200).json({
                msg: 'oi'
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    subirCids: async (req, res) => {
        try {

            uploadCid(req, res, async (err) => {
                let file = fs.readFileSync(req.file.path)

                const workbook = xlsx.read(file, { type: 'array' })

                const firstSheetName = workbook.SheetNames[0]

                const worksheet = workbook.Sheets[firstSheetName]

                let result = xlsx.utils.sheet_to_json(worksheet)

                for (const item of result) {
                    const create = await Cid.create({
                        subCategoria: item.subcategoria,
                        descricao: item.descricao
                    })
                }

                return res.status(200).json({
                    msg: 'oii'
                })

            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'rror'
            })
        }
    },

    buscarCids: async (req, res) => {
        try {

            const { pesquisa } = req.params

            const cids = await Cid.find({
                $or: [
                    {
                        "subCategoria": { $regex: pesquisa, $options: 'i' },
                    },
                    {
                        "descricao": { $regex: pesquisa, $options: 'i' },
                    },

                ]
            })

            return res.status(200).json({
                cids
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },



}