const mongoose = require('mongoose')
const Pergunta = mongoose.model('Pergunta')
const Propostas = mongoose.model('PropostaEntrevista')
const Cid = mongoose.model('Cid')
const DadosEntrevista = mongoose.model('DadosEntrevista')
const Rn = mongoose.model('Rn')
const User = mongoose.model('User')

const path = require('path')
const moment = require('moment')
const fs = require('fs')
const multer = require('multer')
const os = require('os')
const xlsx = require('xlsx')
const Horario = require('../models/Horario')

const uploadCid = multer({ dest: os.tmpdir() }).single('file')
const uploadPerguntas = multer({ dest: os.tmpdir() }).single('file')
const uploadDadosEntrevista = multer({ dest: os.tmpdir() }).single('file')
const uploadPropostas = multer({ dest: os.tmpdir() }).single('file')

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
                idade: pessoa.idade,
                faturado: 'Não faturado',
                cids: cids.toString(),
                dataEntrevista: moment(new Date).format('YYYY-MM-DD'),
                houveDivergencia: divBanco
            }, {
                upsert: true
            })

            const updateProposta = await Propostas.findOneAndUpdate({
                _id: pessoa._id
            }, {
                status: 'Concluído',
                anexadoSisAmil: 'Anexar',
                houveDivergencia: divBanco,
                divergencia: respostasConc['divergencia'],
                cids: cids.toString()
            })

            // const updateFaturamento = await DadosEntrevista.findOneAndUpdate({
            //     $and: [
            //         {
            //             nome: pessoa.nome
            //         }, {
            //             proposta: pessoa.proposta
            //         }
            //     ]
            // }, {
            //     faturado: 'Não faturado'
            // })

            // const adicionarCidsEntrevista = await DadosEntrevista.findOneAndUpdate({
            //     $and: [
            //         {
            //             nome: pessoa.nome
            //         }, {
            //             proposta: pessoa.proposta
            //         }
            //     ]
            // }, {
            //     cids: cids.toString()
            // })

            // const adicionarCidsProposta = await Propostas.findOneAndUpdate({
            //     $and: [
            //         {
            //             nome: pessoa.nome
            //         }, {
            //             proposta: pessoa.proposta
            //         }
            //     ]
            // }, {
            //     cids: cids.toString(),

            // })

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
                        subCategoria: item.subCategoria,
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
                anexadoSisAmil: 'Anexado',
                quemAnexou: req.user
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

            const { id, motivoCancelamento } = req.body

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
                cancelado: true,
                divergencia: motivoCancelamento
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
    },

    subirPerguntas: async (req, res) => {
        try {

            uploadPerguntas(req, res, async (err) => {
                let file = fs.readFileSync(req.file.path)

                const workbook = xlsx.read(file, { type: 'array' })

                const firstSheetName = workbook.SheetNames[0]

                const worksheet = workbook.Sheets[firstSheetName]

                let result = xlsx.utils.sheet_to_json(worksheet)

                for (const item of result) {

                    let subPerguntasNao = item.subPerguntasNao?.split(',')
                    let subPerguntasSim = item.subPerguntasSim?.split(',')

                    if (subPerguntasNao == undefined && subPerguntasSim == undefined) {
                        console.log('nao insere subPergunta');
                        const create = await Pergunta.create({
                            pergunta: item.pergunta,
                            formulario: item.formulario,
                            categoria: item.categoria,
                            existeSub: item.existeSub,
                            name: item.name,
                            sexo: item.sexo
                        })
                    } else {
                        const create = await Pergunta.create({
                            pergunta: item.pergunta,
                            formulario: item.formulario,
                            categoria: item.categoria,
                            existeSub: item.existeSub,
                            subPerguntasSim: subPerguntasSim,
                            name: item.name,
                            sexo: item.sexo
                        })
                    }
                }

                return res.status(200).json({
                    msg: 'oii'
                })

            })
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    subirDadosEntrevista: async (req, res) => {
        try {
            uploadPerguntas(req, res, async (err) => {
                let file = fs.readFileSync(req.file.path)

                const workbook = xlsx.read(file, { type: 'array' })

                const firstSheetName = workbook.SheetNames[0]

                const worksheet = workbook.Sheets[firstSheetName]

                let result = xlsx.utils.sheet_to_json(worksheet)

                for (let item of result) {
                    for (const e of (Object.keys(item))) {
                        if (e === 'dataFaturamento' || e === 'dataEntrevista') {

                            item[e] = ExcelDateToJSDate(item[e])
                            item[e].setDate(item[e].getDate() + 1)
                            item[e] = moment(item[e]).format('YYYY-MM-DD')

                        } else if (e === 'dataNascimento') {
                            item[e] = ExcelDateToJSDate(item[e])
                            item[e].setDate(item[e].getDate() + 1)
                            item[e] = moment(item[e]).format('YYYY-MM-DD')
                        }
                        await DadosEntrevista.findOneAndUpdate({
                            $and: [
                                {
                                    nome: item.nome
                                }, {
                                    proposta: item.proposta
                                }
                            ]
                        }, {
                            [e]: item[e]
                        }, {
                            upsert: true
                        })
                    }
                }

                return res.status(200).json({
                    msg: 'oii'
                })

            })
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    subirPropostas: async (req, res) => {
        try {
            uploadPerguntas(req, res, async (err) => {
                let file = fs.readFileSync(req.file.path)

                const workbook = xlsx.read(file, { type: 'array' })

                const firstSheetName = workbook.SheetNames[0]

                const worksheet = workbook.Sheets[firstSheetName]

                let result = xlsx.utils.sheet_to_json(worksheet)

                for (let item of result) {
                    for (const e of (Object.keys(item))) {

                        if (e === 'dataRecebimento' || e === 'vigencia') {
                            item[e] = ExcelDateToJSDate(item[e])
                            item[e].setDate(item[e].getDate() + 1)
                            item[e] = moment(item[e]).format('YYYY-MM-DD')
                        }
                        if (e === 'dataNascimento') {
                            item[e] = ExcelDateToJSDate(item[e])
                            item[e].setDate(item[e].getDate() + 1)
                            item[e] = moment(item[e]).format('YYYY-MM-DD')
                        }
                        if (e === 'dataEntrevista') {
                            item[e] = ExcelDateToJSDate(item[e])
                            item[e].setDate(item[e].getDate() + 1)
                            item[e] = moment(item[e]).format('YYYY-MM-DD')
                        }

                        await Propostas.findOneAndUpdate({
                            $and: [
                                {
                                    nome: item.nome
                                }, {
                                    proposta: item.proposta
                                }
                            ]
                        }, {
                            [e]: item[e]
                        }, {
                            upsert: true
                        })
                    }
                }

                return res.status(200).json({
                    msg: 'oii'
                })

            })
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    mostrarDadosProducao: async (req, res) => {
        try {

            const entrevistas = await DadosEntrevista.find()

            let mapQuantidadeMesAno = new Map()
            let quantidadeMesAno = {}

            let quantidadeAnalistaMesAno = {}
            let quantidadeAnalistaDia = {}

            entrevistas.forEach(e => {

                /* Logica para verificar se ja existe array com chave no map das entrevistas */

                if (mapQuantidadeMesAno.has(moment(e.dataEntrevista).format('MM/YYYY'))) {
                    mapQuantidadeMesAno.set(moment(e.dataEntrevista).format('MM/YYYY'), mapQuantidadeMesAno.get(moment(e.dataEntrevista).format('MM/YYYY')) + 1)
                } else {
                    mapQuantidadeMesAno.set(moment(e.dataEntrevista).format('MM/YYYY'), 1)
                }

                /* Logica para verificar se ja existe propriedade analista e data com a quantidade de entrevistas realizar por mes */

                if (!quantidadeAnalistaMesAno.hasOwnProperty(e.responsavel)) {
                    quantidadeAnalistaMesAno[e.responsavel] = {}
                    if (!quantidadeAnalistaMesAno[e.responsavel].hasOwnProperty(moment(e.dataEntrevista).format('MM/YYYY'))) {
                        quantidadeAnalistaMesAno[e.responsavel][moment(e.dataEntrevista).format('MM/YYYY')] = 1
                    } else {
                        quantidadeAnalistaMesAno[e.responsavel][moment(e.dataEntrevista).format('MM/YYYY')] = quantidadeAnalistaMesAno[e.responsavel][moment(e.dataEntrevista).format('MM/YYYY')] + 1
                    }
                } else {
                    if (!quantidadeAnalistaMesAno[e.responsavel].hasOwnProperty(moment(e.dataEntrevista).format('MM/YYYY'))) {
                        quantidadeAnalistaMesAno[e.responsavel][moment(e.dataEntrevista).format('MM/YYYY')] = 1
                    } else {
                        quantidadeAnalistaMesAno[e.responsavel][moment(e.dataEntrevista).format('MM/YYYY')] = quantidadeAnalistaMesAno[e.responsavel][moment(e.dataEntrevista).format('MM/YYYY')] + 1
                    }
                }
                /* Logica para verificar se ja existe propriedade analista e data com a quantidade de entrevistas realizar por dia */

                if (!quantidadeAnalistaDia.hasOwnProperty(e.responsavel)) {
                    quantidadeAnalistaDia[e.responsavel] = {}
                    if (!quantidadeAnalistaDia[e.responsavel].hasOwnProperty(moment(e.dataEntrevista).format('YYYY-MM-DD'))) {
                        quantidadeAnalistaDia[e.responsavel][moment(e.dataEntrevista).format('YYYY-MM-DD')] = 1
                    } else {
                        quantidadeAnalistaDia[e.responsavel][moment(e.dataEntrevista).format('YYYY-MM-DD')] = quantidadeAnalistaDia[e.responsavel][moment(e.dataEntrevista).format('YYYY-MM-DD')] + 1
                    }
                } else {
                    if (!quantidadeAnalistaDia[e.responsavel].hasOwnProperty(moment(e.dataEntrevista).format('YYYY-MM-DD'))) {
                        quantidadeAnalistaDia[e.responsavel][moment(e.dataEntrevista).format('YYYY-MM-DD')] = 1
                    } else {
                        quantidadeAnalistaDia[e.responsavel][moment(e.dataEntrevista).format('YYYY-MM-DD')] = quantidadeAnalistaDia[e.responsavel][moment(e.dataEntrevista).format('YYYY-MM-DD')] + 1
                    }
                }
            })

            const rns = await Rn.find()

            let mapQuantidadeMesAnoRn = new Map()
            let quantidadeMesAnoRn = {}

            let quantidadeAnalistaMesAnoRn = {}
            let quantidadeAnalistaDiaRn = {}

            rns.forEach(e => {
                if (mapQuantidadeMesAnoRn.has(moment(e.dataConclusao).format('MM/YYYY'))) {
                    mapQuantidadeMesAnoRn.set(moment(e.dataConclusao).format('MM/YYYY'), mapQuantidadeMesAnoRn.get(moment(e.dataConclusao).format('MM/YYYY')) + 1)
                } else {
                    mapQuantidadeMesAnoRn.set(moment(e.dataConclusao).format('MM/YYYY'), 1)
                }

                /* Logica para verificar se ja existe propriedade analista e data com a quantidade de entrevistas realizar por mes */

                if (!quantidadeAnalistaMesAnoRn.hasOwnProperty(e.responsavel)) {
                    quantidadeAnalistaMesAnoRn[e.responsavel] = {}
                    if (!quantidadeAnalistaMesAnoRn[e.responsavel].hasOwnProperty(moment(e.dataConclusao).format('MM/YYYY'))) {
                        quantidadeAnalistaMesAnoRn[e.responsavel][moment(e.dataConclusao).format('MM/YYYY')] = 1
                    } else {
                        quantidadeAnalistaMesAnoRn[e.responsavel][moment(e.dataConclusao).format('MM/YYYY')] = quantidadeAnalistaMesAnoRn[e.responsavel][moment(e.dataConclusao).format('MM/YYYY')] + 1
                    }
                } else {
                    if (!quantidadeAnalistaMesAnoRn[e.responsavel].hasOwnProperty(moment(e.dataConclusao).format('MM/YYYY'))) {
                        quantidadeAnalistaMesAnoRn[e.responsavel][moment(e.dataConclusao).format('MM/YYYY')] = 1
                    } else {
                        quantidadeAnalistaMesAnoRn[e.responsavel][moment(e.dataConclusao).format('MM/YYYY')] = quantidadeAnalistaMesAnoRn[e.responsavel][moment(e.dataConclusao).format('MM/YYYY')] + 1
                    }
                }
                /* Logica para verificar se ja existe propriedade analista e data com a quantidade de entrevistas realizar por dia */

                if (!quantidadeAnalistaDiaRn.hasOwnProperty(e.responsavel)) {
                    quantidadeAnalistaDiaRn[e.responsavel] = {}
                    if (!quantidadeAnalistaDiaRn[e.responsavel].hasOwnProperty(moment(e.dataConclusao).format('YYYY-MM-DD'))) {
                        quantidadeAnalistaDiaRn[e.responsavel][moment(e.dataConclusao).format('YYYY-MM-DD')] = 1
                    } else {
                        quantidadeAnalistaDiaRn[e.responsavel][moment(e.dataConclusao).format('YYYY-MM-DD')] = quantidadeAnalistaDiaRn[e.responsavel][moment(e.dataConclusao).format('YYYY-MM-DD')] + 1
                    }
                } else {
                    if (!quantidadeAnalistaDiaRn[e.responsavel].hasOwnProperty(moment(e.dataConclusao).format('YYYY-MM-DD'))) {
                        quantidadeAnalistaDiaRn[e.responsavel][moment(e.dataConclusao).format('YYYY-MM-DD')] = 1
                    } else {
                        quantidadeAnalistaDiaRn[e.responsavel][moment(e.dataConclusao).format('YYYY-MM-DD')] = quantidadeAnalistaDiaRn[e.responsavel][moment(e.dataConclusao).format('YYYY-MM-DD')] + 1
                    }
                }

            })

            mapQuantidadeMesAno.forEach((e, key) => {
                quantidadeMesAno[key] = e
            })

            mapQuantidadeMesAnoRn.forEach((e, key) => {
                quantidadeMesAnoRn[key] = e
            })

            console.log(quantidadeMesAnoRn, quantidadeAnalistaMesAnoRn, quantidadeAnalistaDiaRn);

            return res.status(200).json({
                quantidadeMesAno,
                quantidadeAnalistaMesAno,
                quantidadeAnalistaDia,
                quantidadeMesAnoRn,
                quantidadeAnalistaMesAnoRn,
                quantidadeAnalistaDiaRn
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: "Internal Server Error"
            })
        }
    },

    reportAgendadas: async (req, res) => {
        try {

            const propostas = await Propostas.find({
                agendado: 'agendado',
                status: undefined
            })

            const analistas = await User.find({
                enfermeiro: true
            })

            let report = {}
            let qtdAnalistas = {}

            analistas.forEach(e => {
                qtdAnalistas[e.name] = []
            })

            propostas.forEach(obj => {

                let split = obj.dataEntrevista.split(' ')
                let data = split[0]
                data = moment(data).format('DD/MM/YYYY')
                if (!report.hasOwnProperty(data)) {
                    report[data] = {}
                    console.log(obj.enfermeiro);
                    if (!report[data].hasOwnProperty(obj.enfermeiro)) {
                        report[data][obj.enfermeiro] = 0
                    } else {
                        report[data][obj.enfermeiro] = 0
                    }
                } else {
                    report[data][obj.enfermeiro] = 0
                }
            })

            Object.keys(report).forEach(dia => {
                Object.keys(report[dia]).forEach(analista => {
                    propostas.forEach(proposta => {
                        let split = proposta.dataEntrevista.split(' ')
                        let data = split[0]
                        data = moment(data).format('DD/MM/YYYY')
                        if (proposta.enfermeiro == analista && data == dia) {
                            report[dia][analista]++
                        }
                    })
                })

            })

            return res.status(200).json({
                report
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: "Internal Server"
            })
        }
    },

    atualizarVigencia: async (req, res) => {
        try {

            const { vigencia, id } = req.body

            const user = await User.findOne({
                name: req.user
            })

            if (user.accessLevel == 'false') {
                return res.status(200).json({
                    msg: 'Você não tem permissão para alterar a vigencia'
                })
            }

            const proposta = await Propostas.findByIdAndUpdate({
                _id: id
            }, {
                vigencia
            })

            return res.status(200).json({
                proposta
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: "Internal Server Error"
            })
        }
    },

    producaoDiaria: async (req, res) => {
        try {

            const { data } = req.params

            console.log(data);

            const analistas = await User.find({
                enfermeiro: true
            })

            let producao = []

            for (const item of analistas) {
                const count = await DadosEntrevista.find({
                    responsavel: item.name,
                    dataEntrevista: data
                }).count()

                producao.push({
                    analista: item.name,
                    quantidade: count
                })
            }

            const total = await DadosEntrevista.find({
                dataEntrevista: data
            }).count()

            return res.status(200).json({
                producao,
                total
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    alterarFormulario: async (req, res) => {
        try {

            const { id, formulario } = req.body

            const proposta = await Propostas.findByIdAndUpdate({
                _id: id
            }, {
                formulario
            })

            return res.status(200).json({
                proposta
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    adicionarCid: async (req, res) => {
        try {
            
            const {cid, descricao} = req.body

            console.log(cid, descricao);

            const result = await Cid.create({
                subCategoria: cid,
                descricao: descricao
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
    }
}

function ExcelDateToJSDate(serial) {
    var utc_days = Math.floor(serial - 25569);
    var utc_value = utc_days * 86400;
    var date_info = new Date(utc_value * 1000);

    var fractional_day = serial - Math.floor(serial) + 0.0000001;

    var total_seconds = Math.floor(86400 * fractional_day);

    var seconds = total_seconds % 60;

    total_seconds -= seconds;

    var hours = Math.floor(total_seconds / (60 * 60));
    var minutes = Math.floor(total_seconds / 60) % 60;

    return new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate(), hours, minutes, seconds);
}
