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
const Horario = require('../models/Horario')

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

            const { respostas, subRespostas, pessoa, simOuNao, cids, divergencia } = req.body

            let divBanco

            if (divergencia === true) {
                divBanco = 'Sim'
            } else {
                divBanco = 'Não'
            }

            console.log(cids);

            let respostasConc = {

            }

            Object.keys(simOuNao).forEach(key => {
                respostasConc[`${key}`] += `${simOuNao[key]} \n `
            })


            Object.keys(subRespostas).forEach(key => {
                let split = key.split('-')

                respostasConc[`${split[0]}`] += `${split[1]} ${subRespostas[key]} \n `

            })

            Object.keys(respostas).forEach(key => {
                respostasConc[`${key}`] += `${respostas[key]} \n `
            })

            const addDadosEntrevistas = await Promise.all(Object.keys(respostasConc).map(async key => {

                return await DadosEntrevista.findOneAndUpdate({
                    $and: [
                        {
                            nome: pessoa.nome
                        }, {
                            proposta: pessoa.proposta
                        }
                    ]
                }, {
                    [key]: respostasConc[key].replace('undefined', '')
                }, {
                    upsert: true
                })
            }))

            // console.log(addDadosEntrevistas);

            const updateDadosEntrevista = await DadosEntrevista.findOneAndUpdate({
                $and: [
                    {
                        nome: pessoa.nome
                    }, {
                        proposta: pessoa.proposta
                    }
                ]
            }, {
                tipoFormulario: pessoa.formulario,
                cpf: pessoa.cpf,
                // dataNascimento: pessoa.dataNascimento,
                responsavel: req.user,
                tipoContrato: pessoa.tipoContrato,
                sexo: pessoa.sexo
            }, {
                upsert: true
            })

            const updateProposta = await Propostas.findOneAndUpdate({
                _id: pessoa._id
            }, {
                status: 'Concluído',
                anexadoSisAmil: 'Anexar',
                houveDivergencia: divBanco,
                divergencia: respostasConc['divergencia']
            })

            const updateFaturamento = await DadosEntrevista.findOneAndUpdate({
                $and: [
                    {
                        nome: pessoa.nome
                    }, {
                        proposta: pessoa.proposta
                    }
                ]
            }, {
                faturado: 'Não faturado'
            })

            const adicionarCidsEntrevista = await DadosEntrevista.findOneAndUpdate({
                $and: [
                    {
                        nome: pessoa.nome
                    }, {
                        proposta: pessoa.proposta
                    }
                ]
            }, {
                cids: cids.toString()
            })

            const adicionarCidsProposta = await Propostas.findOneAndUpdate({
                $and: [
                    {
                        nome: pessoa.nome
                    }, {
                        proposta: pessoa.proposta
                    }
                ]
            }, {
                cids: cids.toString()
            })

            // console.log(pessoa);
            // console.log(updateDadosEntrevista);

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

    mostrarDadosEntrevista: async (req, res) => {
        try {

            const { nome, proposta } = req.params

            const result = await DadosEntrevista.find({
                nome,
                proposta
            })

            console.log(result);

            return res.status(200).json({
                result
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    mostrarDadosEntrevistas: async (req, res) => {
        try {

            const entrevistas = await DadosEntrevista.find()

            return res.status(200).json({
                entrevistas
            })

        } catch (error) {
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    mostrarDadosEntrevistaId: async (req, res) => {
        try {

            const { id } = req.params

            console.log(id);

            const proposta = await DadosEntrevista.findById({
                _id: id
            })

            return res.status(200).json({
                proposta
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Interal Server Error'
            })
        }
    },

    salvarDadosEditados: async (req, res) => {
        try {

            const { dados, id } = req.body

            const update = await Promise.all(Object.keys(dados).map(async key => {
                return await DadosEntrevista.findOneAndUpdate({
                    _id: id
                }, {
                    [key]: dados[key]
                })
            }))

            return res.status(200).json({
                msg: 'oii'
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Interal Server Error'
            })
        }
    },

    buscarPropostasNaoAnexadas: async (req, res) => {
        try {

            const propostas = await Propostas.find({
                anexadoSisAmil: 'Anexar'
            })

            return res.status(200).json({
                propostas
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    anexarSisAmil: async (req, res) => {
        try {

            const { id } = req.body

            const update = await Propostas.findOneAndUpdate({
                _id: id
            }, {
                anexadoSisAmil: 'Anexado'
            })

            return res.status(200).json(
                update
            )

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    reagendar: async (req, res) => {
        try {

            const { id } = req.body

            // const result = await Propostas.findOneAndUpdate({
            //     _id: id
            // }, {
            //     horario: '',
            //     agendado: ''
            // })

            const dadosProposta = await Propostas.findById({
                _id: id
            })

            let split = dadosProposta.dataEntrevista.split(' ')
            let dataEntrevista = split[0]
            dataEntrevista = new Date(dataEntrevista)
            const horario = split[1]

            const atualizarHorarios = await Horario.findOneAndUpdate({
                $and: [
                    {
                        dia: dataEntrevista
                    }, {
                        enfermeiro: dadosProposta.enfermeiro
                    }, {
                        horario: horario
                    }
                ]
            }, {
                agendado: 'Reaberto',
                nome: ''
            })

            console.log(atualizarHorarios);

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    }


}