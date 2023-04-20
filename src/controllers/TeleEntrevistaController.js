const mongoose = require('mongoose')
const Pergunta = mongoose.model('Pergunta')
const Propostas = mongoose.model('PropostaEntrevista')
const Cid = mongoose.model('Cid')
const DadosEntrevista = mongoose.model('DadosEntrevista')
const Rn = mongoose.model('Rn')
const User = mongoose.model('User')
const UrgenciasEmergencia = mongoose.model('UrgenciasEmergencia')

const moment = require('moment')
const fs = require('fs')
const path = require('path');
const multer = require('multer')
const os = require('os')
const xlsx = require('xlsx')
const Horario = require('../models/TeleEntrevista/Horario')
const { default: axios } = require('axios')

const uploadPerguntas = multer({ dest: os.tmpdir() }).single('file')

module.exports = {


    /**
* Busca perguntas do formulário das teles.
*
* @route GET /entrevistas/perguntas
* @returns {object} Perguntas do formulario.
* @throws {error} Erro.
*/

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

    /**
* Envia os dados formulário para o banco.
*
* @route POST /entrevistas/formulario
* @returns {object} dados do formulario.
* @throws {error} Erro.
*/

    enviarDadosFormulario: async (req, res) => {
        try {

            const { respostas, subRespostas, pessoa, simOuNao, cids, divergencia, entrevistaQualidade } = req.body

            /*
                respostas = array das respostas refenente as perguntas principais
                subRespostas = array de respostas referente a subPerguntas
                pessoa = 
                simOuNao = Se sim ou não para a resposta
                cids = array com os cids referente a aquele formulario
                divergencia = Se existe ou nao divergencia
            */

            let divBanco

            //Caso exista divergencia, divBanco recebe sim para inputar no banco

            if (divergencia === true) {
                divBanco = 'Sim'
            } else {
                divBanco = 'Não'
            }

            //respostasConc = Concatena respostas com simOuNao e subRespostas

            let respostasConc = {

            }

            //Percorre o objeto SimOuNao e concatena ou cria no objeto respostasConc os valores do objeto simOuNao

            Object.keys(simOuNao).forEach(key => {
                respostasConc[`${key}`] += `${simOuNao[key]} \n `
            })

            //Percorre o objeto subRespostas e concatena ou cria no objeto respostasConc os valores do objeto subRespostas


            Object.keys(subRespostas).forEach(key => {
                let split = key.split('-')

                respostasConc[`${split[0]}`] += `${split[1]} ${subRespostas[key]} \n `

            })

            //Percorre o objeto respostas e concatena ou cria no objeto respostasConc os valores do objeto respostas

            Object.keys(respostas).forEach(key => {
                respostasConc[`${key}`] += `${respostas[key]} \n `
            })

            //Percorre o objeto respostasConc e insere caso nao exista no banco ou atualiza as respostas dos formulário

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
                    [key]: respostasConc[key].replace('undefined', '') //Este replace é pq algumas respostas vem do formulario como undefined mesmo respondidas, e foi a unica forma que pensei para resolver o problema
                }, {
                    upsert: true
                })
            }

            //Manda para a API das propostas da tele e conclui a tele por lá

            const resp = await axios.put(`${process.env.API_TELE}/concluir`, {
                id: pessoa._id,
                houveDivergencia: divBanco,
                cids: cids.toString(),
                divergencia: respostasConc['divergencia']
            }, {
                withCredentials: true,
                headers: {
                    Authorization: `Bearer ${req.cookies['token']}`
                }
            })

            const updateProposta = resp.data    //Pega os dados referentes aquela proposta por meio dos dados da resposta da API

            const updateDadosEntrevista = await DadosEntrevista.findOneAndUpdate({      //Atualiza alguns dados necessários no formulário que dependem dos dados da proposta
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
                vigencia: updateProposta.vigencia,
                dataRecebimento: updateProposta.dataRecebimento,
                cancelado: false,
                entrevistaQualidade
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

    /**
* Busca so dados dos cids referente ao cid pesqusado.
*
* @route GET /entrevistas/cids/pesquisa/:pesquisa
* @returns {object} Cids pesquisados.
* @throws {error} Erro.
*/

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

    /**
* Busca so dados da entrevista realizada passando o nome e a proposta da pessoa.
*
* @route GET /entrevistas/dadosEntrevista/:proposta/:nome
* @returns {object} Dados da entrevista realizada.
* @throws {error} Erro.
*/


    mostrarDadosEntrevista: async (req, res) => {
        try {

            const { nome, proposta } = req.params

            const result = await DadosEntrevista.find({
                nome,
                proposta
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

    /**
* Busca todas as entrevistas ja realizadas.
*
* @route GET /entrevistas/dadosEntrevista
* @returns {object} Dados de todas as entrevistas.
* @throws {error} Erro.
*/


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

    /**
* Busca dados da entrevista pelo id.
*
* @route GET /entrevistas/buscar/dadosEntrevista/:id
* @returns {object} Dados da entrevista.
* @throws {error} Erro.
*/

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

    /**
* Salva os dados editados da entrevista recebendo o id e as respostas como req.
*
* @route PUT /entrevistas/editar/dadosEntrevista
* @returns {object} Dados da entrevista.
* @throws {error} Erro.
*/

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

    /**
* Busca propostas não anexadas.
*
* @route GET /entrevistas/propostas/anexar
* @returns {object} Propostas não anexadas.
* @throws {error} Erro.
*/

    buscarPropostasNaoAnexadas: async (req, res) => {
        try {

            const propostas = await DadosEntrevista.find({
                anexadoSisAmil: 'Anexar',
                implantacao: { $ne: 'Sim' }
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

    /**
* Atualiza estado para anexado.
*
* @route PUT /entrevistas/propostas/anexar
* @returns {object} Proposta.
* @throws {error} Erro.
*/

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

    /**
* Manda proposta a implantação.
*
* @route PUT /entrevistas/mandarImplatacao
* @returns {object} Proposta.
* @throws {error} Erro.
*/

    mandarImplantacao: async (req, res) => {
        try {

            const { id } = req.body

            const result = await DadosEntrevista.findByIdAndUpdate({
                _id: id
            }, {
                implantacao: 'Sim'
            })

            console.log(result);

            return res.status(200).json(result)

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Interal Server Error'
            })
        }
    },

    /**
* Muda o estado para implantado.
*
* @route PUT /entrevistas/implantar
* @returns {object} Proposta.
* @throws {error} Erro.
*/

    implantar: async (req, res) => {
        try {

            const { id } = req.body

            const result = await DadosEntrevista.findByIdAndUpdate({
                _id: id
            }, {
                implantado: 'Sim'
            })

            return res.status(200).json(result)

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Interal Server Error'
            })
        }
    },

    /**
* Busca propostas não implantadas.
*
* @route GET /entrevistas/naoImplantadas
* @returns {object} Propostas não implantadas.
* @throws {error} Erro.
*/

    naoImplantadas: async (req, res) => {
        try {

            const result = await DadosEntrevista.find({
                implantado: { $ne: 'Sim' },
                implantacao: 'Sim'
            })

            return res.status(200).json(result)

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    /**
* Reagenda proposta.
*
* @route PUT /entrevistas/reagendar
* @returns {object} Proposta.
* @throws {error} Erro.
*/

    reagendar: async (req, res) => {
        try {

            const { id } = req.body

            //Manda uma requisicao get para api da tele na rota proposta/:id para receber os dados daquela proposta

            const resp = await axios.get(`${process.env.API_TELE}/proposta/${id}`, {
                withCredentials: true,
                headers: {
                    Authorization: `Bearer ${req.cookies['token']}`
                }
            })

            const dadosProposta = resp.data

            //Separa o horário da data de entrevista

            let split = dadosProposta.dataEntrevista.split(' ')
            let dataEntrevista = split[0]
            const horario = split[1]

            //Reabre o horário daquele responsável pela entrevista

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

            //Manda para api o id da proposta que deve ser reagendada para voltar para a aba de não agendados

            const reagendar = await axios.put(`${process.env.API_TELE}/reagendar`, {
                id
            }, {
                withCredentials: true,
                headers: {
                    Authorization: `Bearer ${req.cookies['token']}`
                }
            })

            return res.status(200).json({ msg: 'reagendado' })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    /**
* Cancela a proposta.
*
* @route PUT /entrevistas/cancelar
* @returns {object} Proposta.
* @throws {error} Erro.
*/

    cancelarProposta: async (req, res) => {
        try {

            const { id, motivoCancelamento } = req.body

            //Recebe como parametro o id e o motivo do cancelamento

            //Manda para a api das teles o id referente a proposta que deve ser cancelada

            const resp = await axios.put(`${process.env.API_TELE}/cancelar`, {
                id
            }, {
                withCredentials: true,
                headers: {
                    Authorization: `Bearer ${req.cookies['token']}`
                }
            })

            const proposta = resp.data //Recebe os dados da proposta cancelada

            // Cria nos dadosEntrevista com os dados da proposta, o formulario como cancelado e o motivo do cancelamento

            const create = await DadosEntrevista.create({
                nome: proposta.nome,
                cpf: proposta.cpf,
                dataNascimento: proposta.dataNascimento,
                dataEntrevista: null,
                proposta: proposta.proposta,
                cancelado: true,
                divergencia: motivoCancelamento,
                houveDivergencia: 'Não',
                dataEntrevista: moment().format('YYYY-MM-DD'),
                tipoContrato: proposta.tipoContrato,
                dataRecebimento: proposta.dataRecebimento,
                responsavel: motivoCancelamento
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

    /**
* Busca entrevistas, rns e ues não faturadas.
*
* @route GET /entrevistas/naoFaturadas
* @returns {object} Não faturadas.
* @throws {error} Erro.
*/

    buscarNaoFaturados: async (req, res) => {
        try {

            //Busca dados de não faturadas

            const teles = await DadosEntrevista.find({
                faturado: 'Não faturado'
            })

            const rns = await Rn.find({
                faturado: 'Não faturado',
                status: 'Concluido'
            })

            const ues = await UrgenciasEmergencia.find({
                faturado: 'Não faturado',
                status: { $ne: 'Andamento' }
            })

            let entrevistas = []

            //Esses foreachs são responsaveis para deixar em um padrão e colocar dentro de um array as informações

            teles.forEach(e => {
                entrevistas.push({
                    _id: e._id,
                    tipo: 'Tele',
                    proposta: e.proposta,
                    nome: e.nome,
                    dataEntrevista: e.dataEntrevista,
                    faturado: e.faturado,
                    nf: e.nf,
                    analista: e.responsavel
                })
            })

            rns.forEach(e => {
                entrevistas.push({
                    _id: e._id,
                    tipo: 'Rn',
                    proposta: e.proposta,
                    nome: e.beneficiario,
                    dataEntrevista: e.dataConclusao,
                    faturado: e.faturado,
                    nf: e.nf,
                    analista: e.responsavel
                })
            })

            ues.forEach(e => {
                entrevistas.push({
                    _id: e._id,
                    tipo: 'UE',
                    proposta: e.pedido,
                    nome: e.nomeAssociado,
                    dataEntrevista: e.dataConclusao,
                    faturado: e.faturado,
                    nf: e.nf,
                    analista: e.analista
                })
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

    /**
* Busca entrevistas, rns e ues filtradas para o faturamento.
*
* @route GET /entrevistas/faturamento/filtros/:status/:data
* @returns {object} Não faturadas.
* @throws {error} Erro.
*/

    filtrosFaturamento: async (req, res) => {
        try {

            const { status, data } = req.params

            const split = data.split('-')
            const month = split[0]
            const year = split[1]

            if (status == 'todos' && data == 'todos') {     //Caso status = todos e data = todos busca tudo independente da data e status

                const teles = await DadosEntrevista.find()
                const rns = await Rn.find({
                    status: 'Concluido'
                })

                const ues = await UrgenciasEmergencia.find({
                    status: { $ne: 'Andamento' }
                })

                let entrevistas = []

                teles.forEach(e => {
                    entrevistas.push({
                        _id: e._id,
                        tipo: 'Tele',
                        proposta: e.proposta,
                        nome: e.nome,
                        dataEntrevista: e.dataEntrevista,
                        faturado: e.faturado,
                        nf: e.nf
                    })
                })

                rns.forEach(e => {
                    entrevistas.push({
                        _id: e._id,
                        tipo: 'Rn',
                        proposta: e.proposta,
                        nome: e.beneficiario,
                        dataEntrevista: e.dataConclusao,
                        faturado: e.faturado,
                        nf: e.nf
                    })
                })

                ues.forEach(e => {
                    entrevistas.push({
                        _id: e._id,
                        tipo: 'UE',
                        proposta: e.pedido,
                        nome: e.nomeAssociado,
                        dataEntrevista: e.dataConclusao,
                        faturado: e.faturado,
                        nf: e.nf
                    })
                })

                return res.status(200).json({
                    entrevistas
                })
            }

            if (status != 'todos' && data == 'todos') {     //Caso status != todos e data = todos busca referente ao status independente da data
                console.log('status independente da data');
                const teles = await DadosEntrevista.find({
                    faturado: status
                })
                const rns = await Rn.find({
                    faturado: status,
                    status: 'Concluido'
                })

                const ues = await UrgenciasEmergencia.find({
                    faturado: status,
                    status: { $ne: 'Andamento' }
                })

                let entrevistas = []

                teles.forEach(e => {
                    entrevistas.push({
                        _id: e._id,
                        tipo: 'Tele',
                        proposta: e.proposta,
                        nome: e.nome,
                        dataEntrevista: e.dataEntrevista,
                        faturado: e.faturado,
                        nf: e.nf
                    })
                })

                rns.forEach(e => {
                    entrevistas.push({
                        _id: e._id,
                        tipo: 'Rn',
                        proposta: e.proposta,
                        nome: e.beneficiario,
                        dataEntrevista: e.dataConclusao,
                        faturado: e.faturado,
                        nf: e.nf
                    })
                })

                ues.forEach(e => {
                    entrevistas.push({
                        _id: e._id,
                        tipo: 'UE',
                        proposta: e.pedido,
                        nome: e.nomeAssociado,
                        dataEntrevista: e.dataConclusao,
                        faturado: e.faturado,
                        nf: e.nf
                    })
                })

                return res.status(200).json({
                    entrevistas
                })
            }

            if (status == 'todos' && data != 'todos') {     //Caso status = todos e data != todos busca referente a data e independente do status
                console.log('tudo de tal data');
                const telesBanco = await DadosEntrevista.find()

                const teles = telesBanco.filter(e => {
                    return moment(e.createdAt).format('YYYY-MM') == data && e.cancelado == undefined
                })

                const rnsBanco = await DadosEntrevista.find({
                    status: 'Concluido'
                })

                const rns = rnsBanco.filter(e => {
                    return moment(e.dataConclusao).format('YYYY-MM') === data
                })

                const uesBanco = await UrgenciasEmergencia.find({
                    status: { $ne: 'Andamento' }
                })

                const ues = uesBanco.filter(e => {
                    return moment(e.dataConclusao).format('YYYY-MM') === data
                })

                let entrevistas = []

                teles.forEach(e => {
                    entrevistas.push({
                        _id: e._id,
                        tipo: 'Tele',
                        proposta: e.proposta,
                        nome: e.nome,
                        dataEntrevista: e.dataEntrevista,
                        faturado: e.faturado,
                        nf: e.nf
                    })
                })

                rns.forEach(e => {
                    entrevistas.push({
                        _id: e._id,
                        tipo: 'Rn',
                        proposta: e.proposta,
                        nome: e.beneficiario,
                        dataEntrevista: e.dataConclusao,
                        faturado: e.faturado,
                        nf: e.nf
                    })
                })

                ues.forEach(e => {
                    entrevistas.push({
                        _id: e._id,
                        tipo: 'UE',
                        proposta: e.pedido,
                        nome: e.nomeAssociado,
                        dataEntrevista: e.dataConclusao,
                        faturado: e.faturado,
                        nf: e.nf
                    })
                })

                return res.status(200).json({
                    entrevistas
                })
            }

            if (status != 'todos' && data != 'todos') {         //Caso status != todos e data != todos busca referente a data e referente ao status
                console.log('status e data filtrado');
                console.log(status);
                const telesBanco = await DadosEntrevista.find({
                    faturado: status
                })

                const teles = telesBanco.filter(e => {
                    return moment(e.createdAt).format('YYYY-MM') == data && e.cancelado == undefined
                })

                const rnsBanco = await Rn.find({
                    faturado: status,
                    status: 'Concluido'
                })

                const rns = rnsBanco.filter(e => {
                    return moment(e.dataConclusao).format('YYYY-MM') == data
                })

                const uesBanco = await UrgenciasEmergencia.find({
                    faturado: status,
                    status: { $ne: 'Andamento' }
                })

                const ues = uesBanco.filter(e => {
                    return moment(e.dataConclusao).format('YYYY-MM') === data
                })


                let entrevistas = []

                teles.forEach(e => {
                    entrevistas.push({
                        _id: e._id,
                        tipo: 'Tele',
                        proposta: e.proposta,
                        nome: e.nome,
                        dataEntrevista: e.dataEntrevista,
                        faturado: e.faturado,
                        nf: e.nf
                    })
                })

                rns.forEach(e => {
                    entrevistas.push({
                        _id: e._id,
                        tipo: 'Tele',
                        proposta: e.proposta,
                        nome: e.beneficiario,
                        dataEntrevista: e.dataConclusao,
                        faturado: e.faturado,
                        nf: e.nf
                    })
                })

                ues.forEach(e => {
                    entrevistas.push({
                        _id: e._id,
                        tipo: 'UE',
                        proposta: e.pedido,
                        nome: e.nomeAssociado,
                        dataEntrevista: e.dataConclusao,
                        faturado: e.faturado,
                        nf: e.nf
                    })
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

    /**
* Realiza faturamento das propostas selecionadas
*
* @route PUT /entrevistas/faturar
* @returns {object} Faturadas.
* @throws {error} Erro.
*/

    realizarFaturamento: async (req, res) => {
        try {

            const { entrevistas } = req.body

            const update = await Promise.all(entrevistas.map(async (e) => {

                if (e[0].tipo === 'Rn') {
                    return await Rn.findOneAndUpdate({
                        _id: e[0].id
                    }, {
                        faturado: 'Faturado',
                        nf: e[0].nf,
                        dataFaturamento: moment().format('YYYY-MM-DD')
                    })
                }

                if (e[0].tipo === 'UE') {
                    return await UrgenciasEmergencia.findOneAndUpdate({
                        _id: e[0].id
                    }, {
                        faturado: 'Faturado',
                        nf: e[0].nf,
                        dataFaturamento: moment().format('YYYY-MM-DD')
                    })
                }

                if (e[0].tipo === 'Tele') {
                    return await DadosEntrevista.findOneAndUpdate({
                        _id: e[0].id
                    }, {
                        faturado: 'Faturado',
                        nf: e[0].nf,
                        dataFaturamento: moment().format('YYYY-MM-DD')
                    })
                }

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

    /**
* Mostra produção das teles e rns
*
* @route PUT /entrevistas/teste/producao
* @returns {object} Producao.
* @throws {error} Erro.
*/

    mostrarDadosProducao2: async (req, res) => {
        try {

            const entrevistas = await DadosEntrevista.find()

            arrQuantidadeTotalMes = []

            /*
                Produção por mês
                monta um array de objetos, e cada objeto é um mês.
                arrQuantidadeTotalMes = [
                    {
                        data: 'xx/xx/xxxx',
                        quantidade: x,
                        quantidadeAnalistaMes: [{
                            analista: x,
                            quantidade: x,
                            quantidadeAnalistaDia: [{
                                data: 'xx/xx/xxxx',
                                quantidade: x
                            }]
                        }]
                    }
                ]
            */

            entrevistas.forEach(e => {
                //Verifica se ja existe aquele mês no array
                let index = arrQuantidadeTotalMes.findIndex(val => val.data == moment(e.dataEntrevista).format('MM/YYYY'))

                //Caso não exista irá criar um referente as informações
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
                } else { //Se ja existe irá aumentar a quantidade em 1
                    arrQuantidadeTotalMes[index].quantidade++
                }

                //Verifica se ja existe um analista naquele mês
                let indexAnalista = arrQuantidadeTotalMes[index]?.quantidadeAnalistaMes.findIndex(val => val.analista == e.responsavel)

                if (indexAnalista < 0) {    //Se não exister ele cria as informações
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

                //Verifica se ja existe o analista dentro daquele objeto referente aquele mes e dia
                let indexDiaAnalista = arrQuantidadeTotalMes[index]?.quantidadeAnalistaMes[indexAnalista]?.quantidadeAnalistaDia.findIndex(val => val.data == moment(e.dataEntrevista).format('YYYY-MM-DD'))

                if (indexDiaAnalista < 0) { //Se não existir ele irá criar as informações
                    arrQuantidadeTotalMes[index].quantidadeAnalistaMes[indexAnalista].quantidadeAnalistaDia.push({
                        data: moment(e.dataEntrevista).format('YYYY-MM-DD'),
                        quantidade: 1
                    })
                } else {    // Se exister ele irá somar a quantidade em 1
                    if (arrQuantidadeTotalMes[index].quantidadeAnalistaMes[indexAnalista] === undefined) {
                        return
                    }
                    arrQuantidadeTotalMes[index].quantidadeAnalistaMes[indexAnalista].quantidadeAnalistaDia[indexDiaAnalista].quantidade++
                }

            })

            const rns = await Rn.find({
                status: 'Concluido'
            })

            let arrRns = []

            //A lógica é a mesma para as Rns

            rns.forEach(e => {
                let index = arrRns.findIndex(val => val.data == moment(e.dataConclusao).format('MM/YYYY'))

                if (index < 0) {
                    arrRns.push({
                        data: moment(e.dataConclusao).format('MM/YYYY'),
                        quantidade: 1,
                        quantidadeAnalistaMes: [{
                            analista: e.responsavel,
                            quantidade: 1,
                            quantidadeAnalistaDia: [{
                                data: moment(e.dataConclusao).format('YYYY-MM-DD'),
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
                            data: moment(e.dataConclusao).format('YYYY-MM-DD'),
                            quantidade: 1
                        }]
                    })
                } else {
                    if (arrRns[index]?.quantidadeAnalistaMes === undefined) {
                        return
                    }
                    arrRns[index].quantidadeAnalistaMes[indexAnalista].quantidade++
                }

                let indexDiaAnalista = arrRns[index]?.quantidadeAnalistaMes[indexAnalista]?.quantidadeAnalistaDia.findIndex(val => val.data == moment(e.dataConclusao).format('YYYY-MM-DD'))

                if (indexDiaAnalista < 0) {
                    arrRns[index].quantidadeAnalistaMes[indexAnalista].quantidadeAnalistaDia.push({
                        data: moment(e.dataConclusao).format('YYYY-MM-DD'),
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
                arrQuantidadeTotalMes,
            })


        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: "Internal Server"
            })
        }
    },

    /**
* Report das entrevistas agendadas
*
* @route PUT /entrevistas/teste/producao
* @returns {object} Producao.
* @throws {error} Erro.
*/

    reportAgendadas: async (req, res) => {
        try {

            const resp = await axios.get(`${process.env.API_TELE}/agendadas`, {
                withCredentials: true,
                headers: {
                    Authorization: `Bearer ${req.cookies['token']}`
                }
            })

            const propostas = resp.data

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

    /**
* Report das entrevistas agendadas
*
* @route PUT /entrevistas/teste/producao
* @returns {object} Producao.
* @throws {error} Erro.
*/

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

            const resp = await axios.put(`${process.env.API_TELE}/alterarVigencia`, {
                id,
                vigencia
            }, {
                withCredentials: true,
                headers: {
                    Authorization: `Bearer ${req.cookies['token']}`
                }
            })

            const proposta = resp.data

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

            const entrevistas = await DadosEntrevista.find({
                dataEntrevista: data
            })

            let analistas = []

            entrevistas.forEach(e => {
                if (!analistas.includes(e.responsavel)) {
                    analistas.push(e.responsavel)
                }
            })

            let producao = []

            for (const item of analistas) {
                const count = await DadosEntrevista.find({
                    responsavel: item,
                    dataEntrevista: data
                }).count()

                const countRn = await Rn.find({
                    responsavel: item,
                    dataConclusao: data
                }).count()

                producao.push({
                    analista: item,
                    quantidade: count + countRn,
                    quantidadeRn: countRn
                })
            }

            const total = await DadosEntrevista.find({
                dataEntrevista: data
            }).count()

            const totalRn = await Rn.find({
                dataConclusao: data
            }).count()

            console.log(producao);

            return res.status(200).json({
                producao,
                total: total + totalRn,
                totalRn
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

    gerarMensagens: async (req, res) => {
        try {

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
                let parte5 = []
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

                parte4 = `Por gentileza escolha duas janelas de horários para entrarmos em contato com o Sr.(a)`

                let data1 = moment().format('DD/MM/YYYY')
                let data2 = moment().format('DD/MM/YYYY')
                let diaSemana = moment().format('dddd')

                if (diaSemana === 'Friday') {
                    if (new Date().getTime() > new Date(moment().format('YYYY-MM-DD 13:00'))) {
                        data1 = moment().add(3, 'days').format('DD/MM/YYYY')
                        data2 = moment().add(4, 'days').format('DD/MM/YYYY')
                    } else {
                        data1 = moment().format('DD/MM/YYYY')
                        data2 = moment().add(3, 'days').format('DD/MM/YYYY')
                    }
                } else if (diaSemana === 'Thursday') {
                    if (new Date().getTime() > new Date(moment().format('YYYY-MM-DD 13:00'))) {
                        data1 = moment().add(1, 'day').format('DD/MM/YYYY')
                        data2 = moment().add(4, 'days').format('DD/MM/YYYY')
                    } else {
                        data1 = moment().format('DD/MM/YYYY')
                        data2 = moment().add(1, 'day').format('DD/MM/YYYY')
                    }
                } else {
                    if (new Date().getTime() > new Date(moment().format('YYYY-MM-DD 13:00'))) {
                        data1 = moment().add(1, 'day').format('DD/MM/YYYY')
                        data2 = moment().add(2, 'days').format('DD/MM/YYYY')
                    } else {
                        data1 = moment().format('DD/MM/YYYY')
                        data2 = moment().add(1, 'day').format('DD/MM/YYYY')
                    }
                }

                if (new Date().getTime() > new Date(moment().format('YYYY-MM-DD 13:00'))) {
                    parte5.push(`*${data1}*`, 'Das 09:00 às 11:00', 'Das 11:00 às 13:00', 'Das 13:00 às 15:00', 'Das 15:00 às 17:00', 'Das 17:00 às 19:00', `*${data2}*`, 'Das 09:00 às 11:00', 'Das 11:00 às 13:00', 'Das 13:00 às 15:00', 'Das 15:00 às 17:00', 'Das 17:00 às 19:00')
                } else {
                    parte5.push(`*${data1}*`, 'Das 13:00 às 15:00', 'Das 15:00 às 17:00', 'Das 17:00 às 19:00', `*${data2}*`, 'Das 09:00 às 11:00', 'Das 11:00 às 13:00', 'Das 13:00 às 15:00', 'Das 15:00 às 17:00', 'Das 17:00 às 19:00')
                }

                parte5.push('Qual melhor horário?')

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

    alterarSexoEntrevistaRealizada: async (req, res) => {
        try {

            const { id, sexo } = req.body

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
    },

    voltarEntrevista: async (req, res) => {
        try {

            const { id } = req.body

            const dados = await DadosEntrevista.findById({
                _id: id
            })

            const resp = await axios.put(`${process.env.API_TELE}/voltarEntrevista`, {
                nome: dados.nome,
                proposta: dados.proposta
            }, {
                withCredentials: true,
                headers: {
                    Authorization: `Bearer ${req.cookies['token']}`
                }
            })

            await DadosEntrevista.findByIdAndUpdate({
                _id: id
            }, {
                proposta: `${dados.proposta} - Retrocedido`,
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
    },

    migrarBanco: async (req, res) => {

        try {

            const result = await axios.get(`http://10.0.121.55:3002/cancelarPropostasEmMassa`, {
                withCredentials: true
            })

            const arr = result.data

            arr.forEach(async e => {
                const create = await DadosEntrevista.create({
                    nome: e.nome,
                    cpf: e.cpf,
                    dataNascimento: e.dataNascimento,
                    proposta: e.proposta,
                    cancelado: true,
                    divergencia: 'Sem Sucesso de Contato!',
                    houveDivergencia: 'Não',
                    dataEntrevista: moment().format('YYYY-MM-DD'),
                    tipoContrato: e.tipoContrato,
                    dataRecebimento: e.dataRecebimento,
                    responsavel: 'Sem Sucesso de Contato!'
                })
            })

            return res.json(result.data.length)
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    cancelarVigenciasVencidas: async (req, res) => {
        try {


        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    numeroCids: async (req, res) => {
        try {

            const entrevistas = await DadosEntrevista.find()

            let arrAux = entrevistas.filter(e => {
                return e.houveDivergencia === 'Sim'
            })

            console.log(arrAux.length);

            return res.json(arrAux.length)

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    entrevistasQualidade: async (req, res) => {
        try {

            const entrevistas = await DadosEntrevista.find({
                entrevistaQualidade: true
            })

            return res.json(entrevistas)

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    testeMensagem: async (req, res) => {
        try {

    

            return res.json({msg: 'oi'})

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    }


}