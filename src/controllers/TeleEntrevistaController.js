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

            //console.log(respostas, subRespostas);

            if (divergencia === true) {
                divBanco = 'Sim'
            } else {
                divBanco = 'Não'
            }

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

            console.log(respostasConc);

            for (const key of Object.keys(respostasConc)) {
                await DadosEntrevista.findOneAndUpdate({
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
            }

            // const addDadosEntrevistas = await Promise.all(Object.keys(respostasConc).map(async key => {

            //     return await DadosEntrevista.findOneAndUpdate({
            //         $and: [
            //             {
            //                 nome: pessoa.nome
            //             }, {
            //                 proposta: pessoa.proposta
            //             }
            //         ]
            //     }, {
            //         [key]: respostasConc[key].replace('undefined', '')
            //     }, {
            //         upsert: true
            //     })
            // }))

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
                dataNascimento: pessoa.dataNascimento,
                responsavel: req.user,
                tipoContrato: pessoa.tipoContrato,
                sexo: pessoa.sexo,
                idade: pessoa.idade
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
                cids: cids.toString(),

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



            const dadosProposta = await Propostas.findById({
                _id: id
            })

            let split = dadosProposta.dataEntrevista.split(' ')
            let dataEntrevista = split[0]
            dataEntrevista = new Date(dataEntrevista)
            const horario = split[1]

            console.log(dataEntrevista);

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

            const result = await Propostas.findOneAndUpdate({
                _id: id
            }, {
                dataEntrevista: '',
                agendado: '',
                enfermeiro: ''
            })

            return res.status(200).json({
                msg: 'Ok'
            })



        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    cancelarProposta: async (req, res) => {
        try {

            const { id } = req.body

            console.log(id);

            const proposta = await Propostas.findOneAndUpdate({
                _id: id
            }, {
                status: 'Cancelado'
            })

            const create = await DadosEntrevista.create({
                nome: proposta.nome,
                cpf: proposta.cpf,
                dataNascimento: proposta.dataNascimento,
                dataEntrevista: null,
                proposta: proposta.proposta,
                cancelado: true
            })

            return res.status(200).json({
                msg: 'oii'
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    excluirProposta: async (req, res) => {
        try {

            const { id } = req.body

            console.log(id);

            const remove = await Propostas.deleteOne({
                _id: id
            })

            return res.status(200).json({
                remove
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    alterarTelefone: async (req, res) => {
        try {
            const { id, telefone } = req.body

            const result = await Propostas.findOneAndUpdate({
                _id: id
            }, {
                telefone: telefone
            })

            return res.status(200).json({
                result
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    buscarNaoFaturados: async (req, res) => {
        try {

            const entrevistas = await DadosEntrevista.find({
                faturado: 'Não faturado'
            })

            return res.status(200).json({
                entrevistas
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    filtrosFaturamento: async (req, res) => {
        try {

            const { status, data } = req.params

            const split = data.split('-')
            const month = split[0]
            const year = split[1]

            if (status == 'todos' && data == 'todos') {
                console.log('pesquisa tudo');
                const entrevistas = await DadosEntrevista.find()
                return res.status(200).json({
                    entrevistas
                })
            }

            if (status != 'todos' && data == 'todos') {
                console.log('status independente da data');
                const entrevistas = await DadosEntrevista.find({
                    faturado: status
                })
                return res.status(200).json({
                    entrevistas
                })
            }

            if (status == 'todos' && data != 'todos') {
                console.log('tudo de tal data');
                const entrevistasBanco = await DadosEntrevista.find()

                const entrevistas = entrevistasBanco.filter(e => {
                    return moment(e.createdAt).format('MM-YYYY') == data && e.cancelado == undefined
                })

                return res.status(200).json({
                    entrevistas
                })
            }

            if (status != 'todos' && data != 'todos') {
                console.log('status e data filtrado');
                console.log(status);
                const entrevistasBanco = await DadosEntrevista.find({
                    faturado: status
                })

                const entrevistas = entrevistasBanco.filter(e => {
                    return moment(e.createdAt).format('MM-YYYY') == data && e.cancelado == undefined
                })

                return res.status(200).json({
                    entrevistas
                })
            }

            return res.status(200).json({
                msg: 'oi'
            })


        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    realizarFaturamento: async (req, res) => {
        try {

            const { entrevistas } = req.body

            const update = await Promise.all(entrevistas.map(async (e) => {
                return await DadosEntrevista.findOneAndUpdate({
                    _id: e[1]
                }, {
                    faturado: 'Faturado',
                    nf: e[0],
                    dataFaturamento: new Date()
                })
            }))

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

    buscarPropostasNaoRealizadas: async (req, res) => {
        try {

            const result = await Propostas.find()

            const propostas = result.filter(e => {
                return e.status != 'Concluído' && e.status != 'Cancelado'
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
    }
}