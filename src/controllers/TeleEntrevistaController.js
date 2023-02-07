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

            const updateProposta = await Propostas.findOneAndUpdate({
                _id: pessoa._id
            }, {
                status: 'Concluído',
                anexadoSisAmil: 'Anexar',
                houveDivergencia: divBanco,
                divergencia: respostasConc['divergencia'],
                cids: cids.toString()
            })

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
                houveDivergencia: divBanco,
                anexadoSisAmil: 'Anexar',
                vigencia: updateProposta.vigencia
            }, {
                upsert: true
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

            const { dados, id, houveDivergencia, dataNascimento } = req.body

            const update = await Promise.all(Object.keys(dados).map(async key => {
                return await DadosEntrevista.findOneAndUpdate({
                    _id: id
                }, {
                    [key]: dados[key]
                })
            }))

            const atualizar = await DadosEntrevista.findByIdAndUpdate({
                _id: id
            }, {
                houveDivergencia,
                dataNascimento
            })
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

            const propostas = await DadosEntrevista.find({
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

            const update = await DadosEntrevista.findOneAndUpdate({
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

            console.log(proposta.tipoContrato);

            const create = await DadosEntrevista.create({
                nome: proposta.nome,
                cpf: proposta.cpf,
                dataNascimento: proposta.dataNascimento,
                dataEntrevista: null,
                proposta: proposta.proposta,
                cancelado: true,
                divergencia: motivoCancelamento,
                houveDivergencia: 'Não',
                dataEntrevista: moment(new Date()).format('YYYY-MM-DD'),
                tipoContrato: proposta.tipoContrato
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

                        if (e === 'dataFaturamento' || e === 'dataEntrevista' || e === 'dataNascimento' || e === '') {

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

            const analistas = await User.find({
                enfermeiro: true
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

    mostrarDadosProducao2: async (req, res) => {
        try {

            const entrevistas = await DadosEntrevista.find()

            arrQuantidadeTotalMes = []

            entrevistas.forEach(e => {
                let index = arrQuantidadeTotalMes.findIndex(val => val.data == moment(e.dataEntrevista).format('MM/YYYY'))

                if (index < 0) {
                    arrQuantidadeTotalMes.push({
                        data: moment(e.dataEntrevista).format('MM/YYYY'),
                        quantidade: 1,
                        quantidadeAnalistaMes: [{
                            analista: e.responsavel,
                            quantidade: 1,
                            quantidadeAnalistaDia: [{
                                data: moment(e.dataEntrevista).format('YYYY-MM-DD'),
                                quantidade: 1
                            }]
                        }]
                    })
                } else {
                    arrQuantidadeTotalMes[index].quantidade++
                }

                let indexAnalista = arrQuantidadeTotalMes[index]?.quantidadeAnalistaMes.findIndex(val => val.analista == e.responsavel)

                if (indexAnalista < 0) {
                    arrQuantidadeTotalMes[index].quantidadeAnalistaMes.push({
                        analista: e.responsavel,
                        quantidade: 1,
                        quantidadeAnalistaDia: [{
                            data: moment(e.dataEntrevista).format('YYYY-MM-DD'),
                            quantidade: 1
                        }]
                    })
                } else {
                    if (arrQuantidadeTotalMes[index]?.quantidadeAnalistaMes === undefined) {
                        return
                    }
                    arrQuantidadeTotalMes[index].quantidadeAnalistaMes[indexAnalista].quantidade++
                }

                let indexDiaAnalista = arrQuantidadeTotalMes[index]?.quantidadeAnalistaMes[indexAnalista]?.quantidadeAnalistaDia.findIndex(val => val.data == moment(e.dataEntrevista).format('YYYY-MM-DD'))

                // console.log(indexDiaAnalista);

                if (indexDiaAnalista < 0) {
                    arrQuantidadeTotalMes[index].quantidadeAnalistaMes[indexAnalista].quantidadeAnalistaDia.push({
                        data: moment(e.dataEntrevista).format('YYYY-MM-DD'),
                        quantidade: 1
                    })
                } else {
                    if (arrQuantidadeTotalMes[index].quantidadeAnalistaMes[indexAnalista] === undefined) {
                        return
                    }
                    arrQuantidadeTotalMes[index].quantidadeAnalistaMes[indexAnalista].quantidadeAnalistaDia[indexDiaAnalista].quantidade++
                }

            })

            const rns = await Rn.find()

            let arrRns = []

            rns.forEach(e => {
                let index = arrRns.findIndex(val => val.data == moment(e.dataEntrevista).format('MM/YYYY'))

                if (index < 0) {
                    arrRns.push({
                        data: moment(e.dataEntrevista).format('MM/YYYY'),
                        quantidade: 1,
                        quantidadeAnalistaMes: [{
                            analista: e.responsavel,
                            quantidade: 1,
                            quantidadeAnalistaDia: [{
                                data: moment(e.dataEntrevista).format('YYYY-MM-DD'),
                                quantidade: 1
                            }]
                        }]
                    })
                } else {
                    arrRns[index].quantidade++
                }

                let indexAnalista = arrRns[index]?.quantidadeAnalistaMes.findIndex(val => val.analista == e.responsavel)

                if (indexAnalista < 0) {
                    arrRns[index].quantidadeAnalistaMes.push({
                        analista: e.responsavel,
                        quantidade: 1,
                        quantidadeAnalistaDia: [{
                            data: moment(e.dataEntrevista).format('YYYY-MM-DD'),
                            quantidade: 1
                        }]
                    })
                } else {
                    if (arrRns[index]?.quantidadeAnalistaMes === undefined) {
                        return
                    }
                    arrRns[index].quantidadeAnalistaMes[indexAnalista].quantidade++
                }

                let indexDiaAnalista = arrRns[index]?.quantidadeAnalistaMes[indexAnalista]?.quantidadeAnalistaDia.findIndex(val => val.data == moment(e.dataEntrevista).format('YYYY-MM-DD'))

                if (indexDiaAnalista < 0) {
                    arrRns[index].quantidadeAnalistaMes[indexAnalista].quantidadeAnalistaDia.push({
                        data: moment(e.dataEntrevista).format('YYYY-MM-DD'),
                        quantidade: 1
                    })
                } else {
                    if (arrRns[index].quantidadeAnalistaMes[indexAnalista] === undefined) {
                        return
                    }
                    arrRns[index].quantidadeAnalistaMes[indexAnalista].quantidadeAnalistaDia[indexDiaAnalista].quantidade++
                }
            })

            return res.status(200).json({
                arrRns,
                arrQuantidadeTotalMes
            })


        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: "Internal Server"
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

            const analistas = await User.find({
                enfermeiro: true
            })

            let producao = []

            for (const item of analistas) {
                const count = await DadosEntrevista.find({
                    responsavel: item.name,
                    dataEntrevista: data
                }).count()

                const countRn = await Rn.find({
                    responsavel: item.name,
                    dataConclusao: data
                }).count()

                console.log(countRn);

                producao.push({
                    analista: item.name,
                    quantidade: count,
                    quantidadeRn: countRn
                })
            }

            const total = await DadosEntrevista.find({
                dataEntrevista: data
            }).count()

            const totalRn = await Rn.find({
                dataConclusao: data
            }).count()

            return res.status(200).json({
                producao,
                total,
                totalRn
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

            const { cid, descricao } = req.body

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
    },

    alterarSexo: async (req, res) => {
        try {

            const { id, sexo } = req.body

            const proposta = await Propostas.findByIdAndUpdate({
                _id: id
            }, {
                sexo
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

    gerarMensagens: async (req, res) => {
        try {

            const { data } = req.params

            let horarios = await Horario.find({
                dia: data,
                agendado: { $ne: 'agendado' }
            })

            horarios = horarios.map(e => {
                return e.horario
            })

            horarios = horarios.filter((el, i) => {
                return horarios.indexOf(el) === i
            })

            console.log(horarios);

            horarios.sort()

            const propostas = await Propostas.find({
                $and: [
                    { agendado: { $ne: 'agendado' } },
                    { status: { $ne: 'Concluído' } },
                    { status: { $ne: 'Cancelado' } }
                ]
            }).sort('vigencia')

            let arrObj = [

            ]

            for (const item of propostas) {
                const proposta = await Propostas.find({
                    $and: [
                        { agendado: { $ne: 'agendado' } },
                        { status: { $ne: 'Concluído' } },
                        { status: { $ne: 'Cancelado' } },
                        { proposta: item.proposta }
                    ]
                })

                if (proposta.length >= 2) {
                    let pessoas = []
                    for (const iterator of proposta) {
                        pessoas.push({
                            nome: iterator.nome,
                            sexo: iterator.sexo,
                            tipoAssociado: iterator.tipoAssociado,
                            telefone: iterator.telefone
                        })
                    }

                    let titular = {
                        nome: '',
                        sexo: '',
                        telefone: '',
                    }

                    let dependentes = []

                    pessoas.forEach(e => {
                        if (e.tipoAssociado === 'Titular' || e.tipoAssociado === 'Titular ') {
                            if (titular.nome !== '') {
                                dependentes.push({
                                    nome: e.nome,
                                    sexo: e.sexo
                                })
                                return
                            }
                            titular.nome = e.nome
                            titular.sexo = e.sexo
                            titular.telefone = e.telefone
                        } else {
                            dependentes.push({
                                nome: e.nome,
                                sexo: e.sexo
                            })
                        }
                    })

                    arrObj.push({
                        proposta: item.proposta,
                        dependentes: dependentes,
                        titular: titular,
                        tipoContrato: item.tipoContrato,
                    })

                } else {
                    arrObj.push({
                        proposta: item.proposta,
                        dependentes: [],
                        titular: {
                            nome: item.nome,
                            sexo: item.sexo,
                            telefone: item.telefone
                        },
                        tipoContrato: item.tipoContrato
                    })
                }
            }

            let msgs = arrObj.map(item => {
                let saudacao = ''
                let parte1 = ''
                let parte2 = ''
                let parte3 = ''
                let parte4 = ''
                let parte5 = ''
                let parte6 = ''
                if (item.titular.sexo === 'M') {
                    saudacao = `Prezado Sr. ${item.titular.nome}, `
                    parte1 = `Somos da equipe de adesão da operadora de saúde Amil e para concluirmos a contratação do Plano de Saúde do Sr. e `
                } else {
                    saudacao = `Prezada Sra. ${item.titular.nome}, `
                    parte1 = `Somos da equipe de adesão da operadora de saúde Amil e para concluirmos a contratação do Plano de Saúde da Sra. e `
                }

                item.dependentes.forEach(dependete => {
                    if (dependete.sexo === 'M') {
                        parte2 += `do Sr. ${dependete.nome}, `
                    } else {
                        parte2 += `da Sra. ${dependete.nome}, `
                    }
                })

                parte3 = 'precisamos confirmar alguns dados para que a contratação seja concluída. '

                parte4 = `Precisamos entrar em contato através do número ${item.titular.telefone}. Temos disponíveis os horários para dia *${moment(data).format('DD/MM/YYYY')}* ${ajustarDiaSemana(moment(data).format('dddd'))} as `

                horarios.forEach(e => {
                    parte5 += `${e} - `
                })

                parte5 += 'Qual melhor horário?'

                parte6 = 'Informamos que vamos ligar dos números 11 42404975 ou 42403554, pedimos tirar do spam para evitar bloqueio da ligação.'

                let parte8 = 'Desde já agradecemos.'

                let parte7 = ` Proposta: ${item.proposta}`

                const msg = {
                    saudacao,
                    parte1,
                    parte2,
                    parte3,
                    parte4,
                    parte5,
                    parte6,
                    parte7,
                    parte8,
                    proposta: item.proposta,
                    tipoContrato: item.tipoContrato

                }

                return msg
            })

            setMsg = new Set()

            msgs = msgs.filter((item) => {
                const msgDuplicada = setMsg.has(item.proposta)
                setMsg.add(item.proposta)
                return !msgDuplicada
            })

            return res.status(200).json({
                msgs
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: "Internal Server Error"
            })
        }
    },

    alterarDataNascimento: async (req, res) => {
        try {
            const { id, dataNascimento } = req.body

            const update = await DadosEntrevista.findByIdAndUpdate({
                _id: id
            }, {
                dataNascimento: dataNascimento
            })

            return res.status(200).json({
                update
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    buscarEntrevistaRealizada: async (req, res) => {
        try {

            const { pesquisa } = req.params

            const result = await DadosEntrevista.find({
                $or: [
                    {
                        proposta: { $regex: pesquisa }
                    },
                    {
                        nome: { $regex: pesquisa }
                    },
                    {
                        cpf: { $regex: pesquisa }
                    }
                ]
            })

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

    alterarSexoEntrevistaRealizada: async (req, res)=>{
        try {
            
            const {id, sexo} = req.body

            await DadosEntrevista.findByIdAndUpdate({
                _id: id
            }, {
                sexo
            })
            
            return res.status(200).json({
                msg: 'ok'
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    }

    // ajustarTipoContrato: async (req, res) => {
    //     try {

    //         const propostas = await Propostas.find()
    //         for (const proposta of propostas) {
    //             if(proposta.tipoContrato){
    //                 await DadosEntrevista.updateMany({
    //                     proposta: proposta.proposta
    //                 }, {
    //                     tipoContrato: proposta.tipoContrato
    //                 })
    //             } 
    //         }

    //         const dadosEntrevistas = await DadosEntrevista.updateMany({
    //             tipoContrato: undefined
    //         }, {
    //             tipoContrato: 'Coletivo por Adesão com Administradora'
    //         })

    //         console.log('atualizou');

    //         return res.status(200).json({
    //             msg: 'oii'
    //         })

    //     } catch (error) {
    //         return res.status(500).json({
    //             msg: 'Internal server error'
    //         })
    //     }
    // }
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

const ajustarDiaSemana = date => {
    try {

        switch (date) {
            case 'Monday':
                return 'Segunda'
                break;
            case 'Tuesday':
                return 'Terça'
                break;
            case 'Wednesday':
                return 'Quarta'
                break;
            case 'Thursday':
                return 'Quinta'
                break;
            case 'Friday':
                return 'Sexta'
                break;
            case 'Saturday':
                return 'Sábado'
                break;
            case 'Sunday':
                return 'Domingo'
                break;
            default:
                break;
        }

    } catch (error) {
        console.log(error);
    }
}