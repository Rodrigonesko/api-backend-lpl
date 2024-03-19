const Pergunta = require('../models/TeleEntrevista/Pergunta')
const Propostas = require('../models/TeleEntrevista/PropostaEntrevista')
const Cid = require('../models/TeleEntrevista/Cid')
const DadosEntrevista = require('../models/TeleEntrevista/DadosEntrevista')
const Rn = require('../models/TeleEntrevista/Rn')
const User = require('../models/User/User')
const UrgenciasEmergencia = require('../models/UrgenciasEmergencias/UrgenciasEmergencia')

const moment = require('moment')
const fs = require('fs')
const multer = require('multer')
const os = require('os')
const xlsx = require('xlsx')
const Horario = require('../models/TeleEntrevista/Horario')
const { default: axios } = require('axios')
const Log = require('../models/Logs/LogTele')
const mega = require('megajs')

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = './uploads/entrevistas/'
        if (!fs.existsSync(dir)) {
            fs.mkdir(dir, (err) => {
                if (err) {
                    console.log("Algo deu errado", err);
                    return
                }
                console.log("Diretório criado!")
            })
        }
        cb(null, dir)
    },

    filename: (req, file, cb) => {
        cb(null, file.originalname)
    }
})

const multerUploadImplantacao = multer({ storage }).single('file')

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

    /**
* Envia os dados formulário para o banco.
*
* @route POST /entrevistas/formulario
* @returns {object} dados do formulario.
* @throws {error} Erro.
*/

    enviarDadosFormulario: async (req, res) => {
        try {

            let { respostas, subRespostas, pessoa, simOuNao, cids, divergencia, entrevistaQualidade } = req.body

            let codigosCids = ''
            let cidsAjustados = ''

            for (const cid of cids) {
                const codigo = cid.substring(0, 4);
                codigosCids += `${codigo} - `
                cidsAjustados += `${cid}, `
            }

            console.log(cidsAjustados);



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
                cids = []
                codigosCids = ''
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
                cids: cidsAjustados,
                divergencia: respostasConc['divergencia'],
                responsavel: req.user
            }, {
                withCredentials: true,
                headers: {
                    Authorization: `Bearer ${req.token}`
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
                cids: cidsAjustados,
                codigosCids: codigosCids,
                dataEntrevista: moment(new Date).format('YYYY-MM-DD'),
                houveDivergencia: divBanco,
                anexadoSisAmil: 'Anexar',
                vigencia: updateProposta.vigencia,
                dataRecebimento: updateProposta.dataRecebimento,
                cancelado: false,
                entrevistaQualidade,
                filial: updateProposta.filial,
                idProposta: updateProposta._id,
                tea: subRespostas['espectro-Diagnostico:'],
                administradora: updateProposta.administradora
            }, {
                upsert: true
            })

            //Cria um log com os dados da proposta e do formulario
            await Log.create({
                nome: req.user,
                acao: `Formulário ${pessoa.formulario} preenchido`,
                data: moment().format('DD/MM/YYYY HH:mm:ss')
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

            const proposta = await DadosEntrevista.findOne({
                $or: [
                    { _id: id },
                    { idProposta: id }
                ]
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

            let { dados, id, houveDivergencia, dataNascimento, nome, cpf } = req.body

            let codigosCids = ''

            for (const cid of dados.cids || []) {
                const codigo = cid.substring(0, 4);
                codigosCids += `${codigo} - `
            }

            if (houveDivergencia === 'Sim') {
                dados.codigosCids = codigosCids
            } else {
                dados.cids = []
                codigosCids = ''
            }

            if (!dados.cids) {
                dados.cids = undefined
            } else {
                dados.cids = dados.cids.join(', ')
            }

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
            }).lean()

            const nomeAntigo = atualizar.nome

            if (req.user === 'Claudia Rieth' || req.user === 'Administrador' || req.user === 'Fernanda Ribeiro' || req.user === 'Gislaine Alberton Almeida' || req.user === 'Rodrigo Onesko Dias' || req.user === 'Bruna Tomazoni' || req.user === 'Maria Tereza Santos') {
                await DadosEntrevista.findByIdAndUpdate({
                    _id: id
                }, {
                    nome,
                    cpf
                })

                const dados = {
                    nome,
                    cpf,
                    nomeAntigo,
                    proposta: atualizar.proposta
                }

                await axios.put(`${process.env.API_TELE}/alterarDadosProposta`, {
                    dados
                }, {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${req.token}`
                    }
                })

                await Log.create({
                    nome: req.user,
                    acao: `Dados da entrevista ${atualizar.proposta} alterados.`,
                    data: moment().format('DD/MM/YYYY HH:mm:ss')
                })
            }

            return res.status(200).json({
                msg: 'ok'
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
                quemAnexou: req.user,
                dataAnexado: moment().format('YYYY-MM-DD')
            })

            await Log.create({
                nome: req.user,
                acao: `Proposta ${update.proposta} anexada.`,
                data: moment().format('DD/MM/YYYY HH:mm:ss')
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
                implantacao: 'Sim',
                dataMandouImplantacao: moment().format('YYYY-MM-DD'),
                quemMandouImplantacao: req.user
            })

            await Log.create({
                nome: req.user,
                acao: `Proposta ${result.proposta} enviada para implantação.`,
                data: moment().format('DD/MM/YYYY HH:mm:ss')
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
                _id: id,
            }, {
                implantado: 'Sim',
                quemImplantou: req.user,
                dataImplantado: moment().format('YYYY-MM-DD')
            })

            await Log.create({
                nome: req.user,
                acao: `Proposta ${result.proposta} implantada.`,
                data: moment().format('DD/MM/YYYY HH:mm:ss')
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
                    Authorization: `Bearer ${req.token}`
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
                    Authorization: `Bearer ${req.token}`
                }
            })

            //Cria um log com os dados da proposta e do formulario
            await Log.create({
                nome: req.user,
                acao: `Proposta ${dadosProposta.proposta} do beneficiario ${dadosProposta.nome} reagendada.`,
                data: moment().format('DD/MM/YYYY HH:mm:ss')
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
                    Authorization: `Bearer ${req.token}`
                }
            })

            const proposta = resp.data //Recebe os dados da proposta cancelada

            // Cria nos dadosEntrevista com os dados da proposta, o formulario como cancelado e o motivo do cancelamento

            await DadosEntrevista.create({
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
                responsavel: motivoCancelamento,
                filial: proposta.filial,
                idProposta: proposta._id,
                administradora: proposta.administradora
            })

            //Cria um log com os dados da proposta e do formulario
            await Log.create({
                nome: req.user,
                acao: `Proposta ${proposta.proposta} do beneficiario ${proposta.nome} cancelada.`,
                data: moment().format('DD/MM/YYYY HH:mm:ss')
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


    /**
* Mostra produção das teles e rns
*
* @route PUT /entrevistas/teste/producao
* @returns {object} Producao.
* @throws {error} Erro.
*/

    mostrarDadosProducaoTele: async (req, res) => {
        try {

            const { data } = req.query

            let dataCorrigida = data.split('/').reverse().join('-')
            console.log(dataCorrigida);

            const entrevistas = await DadosEntrevista.find({
                dataEntrevista: { $regex: dataCorrigida }
            }).lean()

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

            for (let e of entrevistas) {

                // Formata a data da entrevista para o formato MM/YYYY
                const formattedMonth = moment(e.dataEntrevista).format('MM/YYYY');
                // Formata a data da entrevista para o formato YYYY-MM-DD
                const formattedDay = moment(e.dataEntrevista).format('YYYY-MM-DD');

                // Procura uma entrada no array arrQuantidadeTotalMes que corresponda ao mês formatado
                let monthEntry = arrQuantidadeTotalMes.find(val => val.data == formattedMonth);

                // Se não encontrar uma entrada para o mês, cria uma nova
                if (!monthEntry) {
                    monthEntry = {
                        data: formattedMonth,
                        quantidade: 0,
                        quantidadeAnalistaMes: []
                    };
                    arrQuantidadeTotalMes.push(monthEntry);
                }

                // Incrementa a quantidade de entrevistas para o mês
                monthEntry.quantidade++;

                // Procura uma entrada para o analista responsável pela entrevista no mês atual
                let analistaEntry = monthEntry.quantidadeAnalistaMes.find(val => val.analista == e.responsavel);

                // Se não encontrar uma entrada para o analista, cria uma nova
                if (!analistaEntry) {
                    analistaEntry = {
                        analista: e.responsavel,
                        quantidade: 0,
                        quantidadeAnalistaDia: []
                    };
                    monthEntry.quantidadeAnalistaMes.push(analistaEntry);
                }

                analistaEntry.quantidade++;

                let diaEntry = analistaEntry.quantidadeAnalistaDia.find(val => val.data == formattedDay);

                if (!diaEntry) {
                    diaEntry = {
                        data: formattedDay,
                        quantidade: 0
                    };
                    analistaEntry.quantidadeAnalistaDia.push(diaEntry);
                }

                diaEntry.quantidade++;
            }

            return res.status(200).json({
                arrQuantidadeTotalMes,
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: "Internal Server"
            })
        }
    },

    mostrarDadosProducaoRns: async (req, res) => {
        try {

            const { data } = req.query

            let dataCorrigida = data.split('/').reverse().join('-')
            console.log(dataCorrigida)

            const rns = await Rn.find({
                status: 'Concluido',
                dataConclusao: { $regex: dataCorrigida }
            }).lean()

            let arrRns = []

            for (let r of rns) {
                // Formata a data da rn para o formato MM/YYYY
                const formattedMonth = moment(r.dataConclusao).format('MM/YYYY');
                // Formata a data da rn para o formato YYYY-MM-DD
                const formattedDay = moment(r.dataConclusao).format('YYYY-MM-DD');

                // Procura uma entrada no array arrRns que corresponda ao mês formatado
                let monthEntry = arrRns.find(val => val.data == formattedMonth);

                if (!monthEntry) {
                    monthEntry = {
                        data: formattedMonth,
                        quantidade: 0,
                        quantidadeAnalistaMes: []
                    };
                    arrRns.push(monthEntry);
                }

                // Incrementa a quantidade de entrevistas para o mês
                monthEntry.quantidade++;

                // Procura uma entrada para o analista responsável pela entrevista no mês atual
                let analistaEntry = monthEntry.quantidadeAnalistaMes.find(val => val.analista == r.responsavel);

                // Se não encontrar uma entrada para o analista, cria uma nova
                if (!analistaEntry) {
                    analistaEntry = {
                        analista: r.responsavel,
                        quantidade: 0,
                        quantidadeAnalistaDia: []
                    };
                    monthEntry.quantidadeAnalistaMes.push(analistaEntry);
                }

                analistaEntry.quantidade++;

                let diaEntry = analistaEntry.quantidadeAnalistaDia.find(val => val.data == formattedDay);

                if (!diaEntry) {
                    diaEntry = {
                        data: formattedDay,
                        quantidade: 0
                    };
                    analistaEntry.quantidadeAnalistaDia.push(diaEntry);
                }

                diaEntry.quantidade++;
            }

            return res.status(200).json({
                arrRns,
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
                    Authorization: `Bearer ${req.token}`
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
                    Authorization: `Bearer ${req.token}`
                }
            })

            const proposta = resp.data

            await Log.create({
                nome: req.user,
                acao: `Proposta ${proposta.proposta} alterada a vigencia para ${vigencia}.`,
                data: moment().format('DD/MM/YYYY HH:mm:ss')
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

            const resultado = await Cid.find({ subCategoria: cid })

            if (resultado.length > 0) {
                return res.status(401).json({
                    msg: 'Cid ja registrado!'
                })
            }

            const result = await Cid.create({
                subCategoria: cid,
                descricao: descricao
            })

            await Log.create({
                nome: req.user,
                acao: `Cid ${cid} adicionado.`,
                data: moment().format('DD/MM/YYYY HH:mm:ss')
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

            await Log.create({
                nome: req.user,
                acao: `Data de nascimento da proposta ${update.proposta} alterada para ${dataNascimento}.`,
                data: moment().format('DD/MM/YYYY HH:mm:ss')
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

            await Log.create({
                nome: req.user,
                acao: `Sexo da proposta ${id} alterado para ${sexo}.`,
                data: moment().format('DD/MM/YYYY HH:mm:ss')
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

            const dados = await DadosEntrevista.find({
                $or: [
                    { _id: id },
                    { idProposta: id }
                ]
            })

            const resp = await axios.put(`${process.env.API_TELE}/voltarEntrevista`, {
                nome: dados[dados.length - 1].nome,
                proposta: dados[dados.length - 1].proposta,

            }, {
                withCredentials: true,
                headers: {
                    Authorization: `Bearer ${req.token}`
                }
            })

            await DadosEntrevista.updateOne({
                $or: [
                    { _id: dados[dados.length - 1]._id },
                ]
            }, {
                proposta: `${dados[dados.length - 1].proposta} - Retrocedido`,
            })

            await Log.create({
                nome: req.user,
                acao: `Proposta ${dados[dados.length - 1].proposta} retrocedida.`,
                data: moment().format('DD/MM/YYYY HH:mm:ss')
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

    numeroCids: async (req, res) => {
        try {

            const entrevistas = await DadosEntrevista.find()

            let arrAux = entrevistas.filter(e => {
                return e.houveDivergencia === 'Sim'
            })

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

    reenviarHorariosDisponiveis: async (req, res) => {
        try {

            const { data, whatsapps } = req.body

            const result = await Horario.find({
                dia: data
            })

            let arr = []

            result.forEach(e => {
                if ((e.agendado !== 'Agendado')) {
                    if (e.dia != moment().format('YYYY-MM-DD')) {
                        arr.push(e.horario)
                    }
                    if (e.horario >= moment().format('HH:mm:ss')) {
                        arr.push(e.horario)
                    }
                }
            })

            const horarios = [...new Set(arr)]

            horarios.sort()

            const urlLocal = 'http://10.0.121.55:3002'

            await axios.put(`${process.env.API_TELE}/reenviarHorariosDisponiveis`, {
                horarios, whatsapps, data
            }, {
                headers: {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${req.token}`
                    }
                }
            })

            await Log.create({
                nome: req.user,
                acao: `Horários disponíveis reenviados para ${whatsapps}`,
                data: moment().format('DD/MM/YYYY HH:mm:ss')
            })

            return res.json(horarios)

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    relatorioProducao: async (req, res) => {
        try {

            const entrevistasRealizadas = await DadosEntrevista.find()

            let arrProd = {}

            for (const item of entrevistasRealizadas) {
                if (item.dataEntrevista) {
                    const dataEntrevista = moment(item.dataEntrevista).format('DD/MM/YYYY')

                    const key = `${item.responsavel}-${dataEntrevista}`

                    if (arrProd[key]) {
                        arrProd[key].tele += 1
                    } else {
                        arrProd[key] = {
                            analista: item.responsavel,
                            data: dataEntrevista,
                            tentativa1: 0,
                            tentativa2: 0,
                            tentativa3: 0,
                            tele: 1,
                            rn: 0,
                            ue: 0,
                            agendado: 0,
                            naoAgendado: 0,
                        }
                    }
                }
            }

            const result = await axios.get(`http://localhost:3002/show`)

            const propostas = result.data.propostas

            for (const item of propostas) {

                if (item.contato1 && item.responsavelContato1 !== 'Bot Whatsapp') {
                    const [diaContato1] = item.contato1.split(" ")
                    const responsavelContato1 = item.responsavelContato1

                    const key = `${responsavelContato1}-${diaContato1}`

                    if (arrProd[key]) {
                        arrProd[key].tentativa1 += 1
                    } else {
                        arrProd[key] = {
                            analista: responsavelContato1,
                            data: diaContato1,
                            tentativa1: 1,
                            tentativa2: 0,
                            tentativa3: 0,
                            tele: 0,
                            rn: 0,
                            ue: 0,
                            agendado: 0,
                            naoAgendado: 0,
                        }
                    }

                }

                if (item.contato2) {
                    const [diaContato2] = item.contato2.split(" ")
                    const responsavelContato2 = item.responsavelContato2

                    const key = `${responsavelContato2}-${diaContato2}`

                    if (arrProd[key]) {
                        arrProd[key].tentativa2 += 1
                    } else {
                        arrProd[key] = {
                            analista: responsavelContato2,
                            data: diaContato2,
                            tentativa1: 0,
                            tentativa2: 1,
                            tentativa3: 0,
                            tele: 0,
                            rn: 0,
                            ue: 0,
                            agendado: 0,
                            naoAgendado: 0,
                        }
                    }

                }

                if (item.contato3) {
                    const [diaContato3] = item.contato3.split(" ")
                    const responsavelContato3 = item.responsavelContato3

                    const key = `${responsavelContato3}-${diaContato3}`

                    if (arrProd[key]) {
                        arrProd[key].tentativa3 += 1
                    } else {
                        arrProd[key] = {
                            analista: responsavelContato3,
                            data: diaContato3,
                            tentativa1: 0,
                            tentativa2: 0,
                            tentativa3: 1,
                            tele: 0,
                            rn: 0,
                            ue: 0,
                            agendado: 0,
                            naoAgendado: 0,
                        }
                    }
                }

                if (item.dataConclusao && item.status === 'Concluído') {

                    const dataConclusao = moment(item.dataConclusao).format("DD/MM/YYYY")
                    const responsavel = item.enfermeiro

                    if (dataConclusao) {

                        const key = `${responsavel}-${dataConclusao}`

                        if (arrProd[key]) {
                            if (item.agendado === 'agendado') {
                                arrProd[key].agendado += 1
                            } else {
                                arrProd[key].naoAgendado += 1
                            }
                        } else {
                            if (item.agendado === 'agendado') {
                                arrProd[key] = {
                                    analista: responsavel,
                                    data: dataConclusao,
                                    tentativa1: 0,
                                    tentativa2: 0,
                                    tentativa3: 0,
                                    tele: 0,
                                    rn: 0,
                                    ue: 0,
                                    agendado: 1,
                                    naoAgendado: 0,
                                }
                            } else {
                                arrProd[key] = {
                                    analista: responsavel,
                                    data: dataConclusao,
                                    tentativa1: 0,
                                    tentativa2: 0,
                                    tentativa3: 0,
                                    tele: 0,
                                    rn: 0,
                                    ue: 0,
                                    agendado: 0,
                                    naoAgendado: 1,
                                }
                            }
                        }
                    }
                }

                //const key = `${item.responsavelContato1}`
            }

            const rns = await Rn.find()

            for (const item of rns) {

                if (item.dataConclusao) {
                    const dataConclusao = moment(item.dataConclusao).format('DD/MM/YYYY')

                    const key = `${item.responsavel}-${dataConclusao}`

                    if (arrProd[key]) {
                        arrProd[key].rn += 1
                    } else {
                        arrProd[key] = {
                            analista: item.responsavel,
                            data: dataConclusao,
                            tentativa1: 0,
                            tentativa2: 0,
                            tentativa3: 0,
                            tele: 0,
                            rn: 1,
                            ue: 0,
                            agendado: 0,
                            naoAgendado: 0
                        }
                    }
                }
            }

            const urgenciaEmergencia = await UrgenciasEmergencia.find()

            for (const item of urgenciaEmergencia) {

                if (item.dataConclusao) {
                    const dataConclusao = moment(item.dataConclusao).format('DD/MM/YYYY')

                    const key = `${item.analista}-${dataConclusao}`

                    if (arrProd[key]) {
                        arrProd[key].ue += 1
                    } else {
                        arrProd[key] = {
                            analista: item.analista,
                            data: dataConclusao,
                            tentativa1: 0,
                            tentativa2: 0,
                            tentativa3: 0,
                            tele: 0,
                            rn: 0,
                            ue: 1,
                            agendado: 0,
                            naoAgendado: 0
                        }
                    }
                }
            }

            return res.json(arrProd)

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    rendimentoIndividualMensal: async (req, res) => {
        try {

            const { mes, analista } = req.params

            const findMelhor = await DadosEntrevista.find({
                dataEntrevista: { $regex: mes }
            })

            const analistasContagem = {}

            for (const proposta of findMelhor) {
                if (proposta.responsavel === 'Sem Sucesso de Contato!') {
                    continue
                }
                const analista = proposta.responsavel
                if (analistasContagem[analista]) {
                    analistasContagem[analista]++
                } else {
                    analistasContagem[analista] = 1
                }
            }

            let analistaMaisConclusoes = null;
            let maxConclusoes = 0;

            for (const analista in analistasContagem) {
                if (analistasContagem[analista] > maxConclusoes) {
                    analistaMaisConclusoes = analista;
                    maxConclusoes = analistasContagem[analista];
                }
            };

            console.log(analistaMaisConclusoes);

            let objTele = {}
            let producaoTele = [
                ['Dia', 'Quantidade', 'Meta']
            ]
            let houveDivergencia = 0
            let naoHouveDivergencia = 0

            const dadosDoMes = await DadosEntrevista.find({
                dataEntrevista: { $regex: mes },
                responsavel: analista
            })

            for (const proposta of dadosDoMes) {
                const key = moment(proposta.dataEntrevista).format('DD/MM/YYYY')

                if (objTele[key]) {
                    objTele[key].entrevistas += 1
                } else {
                    objTele[key] = {
                        entrevistas: 1
                    }
                }

                if (proposta.houveDivergencia === 'Sim') {
                    houveDivergencia += 1
                } else {
                    naoHouveDivergencia += 1
                }

            }

            let total = 0

            for (const item of Object.entries(objTele)) {
                producaoTele.push([
                    item[0],
                    item[1].entrevistas,
                    22
                ])
                total += item[1].entrevistas
            }

            const result = await axios.get(`${process.env.API_TELE}/rendimentoMensal/${mes}/${analista}`, {
                withCredentials: true,
                headers: {
                    Authorization: `Bearer ${req.token}`
                }
            })

            const {
                agendadas,
                naoAgendadas,
                primeiroContato,
                segundoContato,
                terceiroContato,
                arrPrazo
            } = result.data

            console.log(arrPrazo);

            let objRn = {}
            let producaoRn = [
                ['Dia', 'Quantidade']
            ]

            const dadosDoMesRn = await Rn.find({
                dataConclusao: { $regex: mes },
                responsavel: analista
            })

            for (const proposta of dadosDoMesRn) {
                const key = moment(proposta.dataConclusao).format('DD/MM/YYYY')

                if (objRn[key]) {
                    objRn[key].entrevistas += 1
                } else {
                    objRn[key] = {
                        entrevistas: 1
                    }
                }
            }

            let totalRn = 0

            for (const item of Object.entries(objRn)) {
                producaoRn.push([
                    item[0],
                    item[1].entrevistas
                ])

                totalRn += item[1].entrevistas

            }


            let objUe = {}
            let producaoUe = [
                ['Dia', 'Quantidade']
            ]

            const dadosDoMesUe = await UrgenciasEmergencia.find({
                dataConclusao: { $regex: mes },
                analista: analista
            })

            for (const proposta of dadosDoMesUe) {
                const key = moment(proposta.dataConclusao).format('DD/MM/YYYY')

                if (objUe[key]) {
                    objUe[key].entrevistas += 1
                } else {
                    objUe[key] = {
                        entrevistas: 1
                    }
                }
            }

            let totalUe = 0

            for (const item of Object.entries(objUe)) {
                producaoUe.push([
                    item[0],
                    item[1].entrevistas
                ])

                totalUe += item[1].entrevistas

            }

            const findComparativo = await DadosEntrevista.find({
                dataEntrevista: { $regex: mes },
                $or: [
                    { responsavel: analista },
                    { responsavel: analistaMaisConclusoes }
                ]
            })

            const objComparativo = {}
            const arrComparativo = [['Data', 'Eu', 'Melhor']]

            for (const item of findComparativo) {
                const key = moment(item.dataEntrevista).format('DD/MM/YYYY');
                const isAnalista = item.responsavel === analista;
                const entry = objComparativo[key] || { responsavel: 0, melhor: 0 };

                objComparativo[key] = {
                    responsavel: isAnalista ? entry.responsavel + 1 : entry.responsavel,
                    melhor: isAnalista ? entry.melhor : entry.melhor + 1,
                };
            }

            for (const item of Object.entries(objComparativo)) {

                arrComparativo.push([
                    item[0],
                    item[1].responsavel,
                    item[1].melhor,
                ])
            }

            arrComparativo.sort((a, b) => {
                const dateA = new Date(a[0].split('/').reverse().join('-'));
                const dateB = new Date(b[0].split('/').reverse().join('-'));
                return dateA - dateB;
            });

            console.log(arrComparativo);

            return res.json({
                producaoTele,
                total,
                houveDivergencia,
                naoHouveDivergencia,
                agendadas,
                naoAgendadas,
                primeiroContato,
                segundoContato,
                terceiroContato,
                producaoRn,
                totalRn,
                producaoUe,
                totalUe,
                arrPrazo,
                arrComparativo
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    ProducaoMensal: async (req, res) => {
        try {

            const { mes } = req.params

            const find = await DadosEntrevista.find({
                dataEntrevista: { $regex: mes },
            })

            let obj = {}

            for (const item of find) {
                if (obj[item.responsavel]) {
                    obj[item.responsavel].total += 1
                } else {
                    obj[item.responsavel] = {
                        total: 1,
                        d0: 0,
                        d1: 0,
                        d2: 0,
                        d3: 0,
                        d4: 0
                    }
                }
            }

            const result = await axios.get(`${process.env.API_TELE}/producaoMensal/${mes}`, {
                withCredentials: true,
                headers: {
                    Authorization: `Bearer ${req.token}`
                }
            })

            for (const item of result.data) {

                const diasUteis = calcularDiasUteis(moment(item.dataRecebimento), moment(item.dataConclusao), feriados)

                if (diasUteis === 0) {
                    if (obj[item.enfermeiro]) {
                        obj[item.enfermeiro].d0 += 1
                    } else {
                        obj[item.responsavel] = {
                            total: 1,
                            d0: 1,
                            d1: 0,
                            d2: 0,
                            d3: 0,
                            d4: 0
                        }
                    }
                }

                if (diasUteis === 1) {
                    if (obj[item.enfermeiro]) {
                        obj[item.enfermeiro].d1 += 1
                    } else {
                        obj[item.responsavel] = {
                            total: 1,
                            d0: 0,
                            d1: 1,
                            d2: 0,
                            d3: 0,
                            d4: 0
                        }
                    }
                }

                if (diasUteis === 2) {
                    if (obj[item.enfermeiro]) {
                        obj[item.enfermeiro].d2 += 1
                    } else {
                        obj[item.responsavel] = {
                            total: 1,
                            d0: 0,
                            d1: 0,
                            d2: 1,
                            d3: 0,
                            d4: 0
                        }
                    }
                }

                if (diasUteis === 3) {
                    if (obj[item.enfermeiro]) {
                        obj[item.enfermeiro].d3 += 1
                    } else {
                        obj[item.responsavel] = {
                            total: 1,
                            d0: 0,
                            d1: 0,
                            d2: 0,
                            d3: 1,
                            d4: 0
                        }
                    }
                }

                if (diasUteis >= 4) {
                    if (obj[item.enfermeiro]) {
                        obj[item.enfermeiro].d4 += 1
                    } else {
                        obj[item.responsavel] = {
                            total: 1,
                            d0: 0,
                            d1: 0,
                            d2: 0,
                            d3: 0,
                            d4: 1
                        }
                    }
                }
            }

            for (const item of Object.entries(obj)) {

                const totalDados = item[1].total
                const totalApi = item[1].d0 + item[1].d1 + item[1].d2 + item[1].d3 + item[1].d4

                console.log(totalDados, totalApi, item[0]);
            }

            return res.json({
                total: find.length
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    producaoMensalAnexos: async (req, res) => {
        try {

            const { analista, mes } = req.params

            const resultAnexos = await DadosEntrevista.find({
                $or: [
                    {
                        quemAnexou: analista,
                        dataAnexado: { $regex: mes }
                    }
                ]
            })

            const resultImplantado = await DadosEntrevista.find({
                $or: [
                    {
                        quemImplantou: analista,
                        dataImplantado: { $regex: mes }
                    }
                ]
            })


            const resultMandouImplantacao = await DadosEntrevista.find({
                $or: [
                    {
                        quemMandouImplantacao: analista,
                        dataMandouImplantacao: { $regex: mes }
                    }
                ]
            })


            let objAnexos = {}
            let arrAnexos = [['Data', 'Quantidade',]]
            let objImplantados = {}
            let arrImplantados = [['Data', 'Quantidade']]
            let objMandouImplantacao = {}
            let arrMandouImplantacao = [['Data', 'Quantidade']]

            for (const item of resultAnexos) {
                const key = moment(item.dataAnexado).format('DD/MM/YYYY')

                if (objAnexos[key]) {
                    objAnexos[key].quantidade += 1
                } else {
                    objAnexos[key] = {
                        quantidade: 1
                    }
                }
            }

            for (const item of Object.entries(objAnexos)) {
                arrAnexos.push([
                    item[0],
                    item[1].quantidade,
                ])
            }

            arrAnexos.sort((a, b) => {
                const dateA = new Date(a[0].split('/').reverse().join('-'));
                const dateB = new Date(b[0].split('/').reverse().join('-'));
                return dateA - dateB;
            });

            for (const item of resultImplantado) {
                const key = moment(item.dataImplantado).format('DD/MM/YYYY')

                if (objImplantados[key]) {
                    objImplantados[key].quantidade += 1
                } else {
                    objImplantados[key] = {
                        quantidade: 1
                    }
                }
            }

            for (const item of Object.entries(objImplantados)) {
                arrImplantados.push([
                    item[0],
                    item[1].quantidade,
                ])
            }

            arrImplantados.sort((a, b) => {
                const dateA = new Date(a[0].split('/').reverse().join('-'));
                const dateB = new Date(b[0].split('/').reverse().join('-'));
                return dateA - dateB;
            });

            for (const item of resultMandouImplantacao) {
                const key = moment(item.dataMandouImplantacao).format('DD/MM/YYYY')

                if (objMandouImplantacao[key]) {
                    objMandouImplantacao[key].quantidade += 1
                } else {
                    objMandouImplantacao[key] = {
                        quantidade: 1
                    }
                }
            }


            for (const item of Object.entries(objMandouImplantacao)) {
                arrMandouImplantacao.push([
                    item[0],
                    item[1].quantidade,
                ])
            }

            arrMandouImplantacao.sort((a, b) => {
                const dateA = new Date(a[0].split('/').reverse().join('-'));
                const dateB = new Date(b[0].split('/').reverse().join('-'));
                return dateA - dateB;
            });

            return res.json({
                anexos: arrAnexos,
                implantados: arrImplantados,
                mandouImplantacao: arrMandouImplantacao
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error',
                error
            })
        }
    },

    reportAnexos: async (req, res) => {
        try {

            const { data } = req.params

            const result = await DadosEntrevista.find({
                $or: [
                    { dataAnexado: data },
                    { dataMandouImplantacao: data },
                ]
            })

            return res.json(result)

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },


    buscarEntrevistasEntreDatas: async (req, res) => {
        try {

            const { startDate, endDate } = req.query

            const result = await DadosEntrevista.find({
                dataEntrevista: {
                    $gte: startDate || '2022-09-01',
                    $lte: endDate || moment().format('YYYY-MM-DD')
                }
            })

            return res.json(result)

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    uploadImplantacao: async (req, res) => {
        try {

            multerUploadImplantacao(req, res, async (err) => {
                let file = fs.readFileSync(req.file.path)

                const workbook = xlsx.read(file, { type: 'array' })

                const firstSheetName = workbook.SheetNames[0]

                // Obtém a planilha
                const worksheet = workbook.Sheets[firstSheetName]

                // Converte a planilha em JSON
                let result = xlsx.utils.sheet_to_json(worksheet)

                const propostasBanco = await DadosEntrevista.find({
                    implantado: { $ne: 'Sim' },
                    implantacao: 'Sim'
                })

                const propostasAjustadas = propostasBanco.map(proposta => {
                    return ({
                        _id: proposta._id,
                        proposta: +extrairNumerosJuntos(proposta.proposta)
                    })
                })

                let count = 0

                for (const item of result) {
                    const index = propostasAjustadas.findIndex(proposta => proposta.proposta === item['Número da Proposta'])
                    if (index !== -1) {
                        count++
                        await DadosEntrevista.updateMany({
                            proposta: propostasAjustadas[index].proposta
                        }, {
                            situacaoAmil: item['Situação']
                        })
                    }
                }

                return res.json({
                    msg: 'ok'
                })

            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    relatorioProdutividadeMes: async (req, res) => {
        try {

            const { mes } = req.params

            const result = await axios.get(`${process.env.API_TELE}/propostasPorMes/${mes}`, {
                withCredentials: true,
                headers: {
                    Authorization: `Bearer ${req.token}`
                }
            })

            const arrProd = {}

            for (const item of result.data) {

                if (item.dataConclusao) {

                    const dataConclusao = moment(item.dataConclusao).format('DD/MM/YYYY')

                    if (item.enfermeiro === '' || !item.enfermeiro) {
                        continue
                    }

                    const key = `${item.enfermeiro}-${dataConclusao}`

                    if (!arrProd[key]) {
                        arrProd[key] = {
                            analista: item.enfermeiro,
                            data: dataConclusao,
                            quantidade: 0,
                            houveDivergencia: 0,
                            naoHouveDivergencia: 0,
                            agendado: 0,
                            naoAgendado: 0,
                            tentativa1: 0,
                            tentativa2: 0,
                            tentativa3: 0,
                        }
                    }

                    arrProd[key].quantidade += 1

                    if (item.houveDivergencia === 'Sim') {
                        arrProd[key].houveDivergencia += 1
                    } else {
                        arrProd[key].naoHouveDivergencia += 1
                    }

                    if (item.agendado === 'agendado') {
                        arrProd[key].agendado += 1
                    } else {
                        arrProd[key].naoAgendado += 1
                    }

                    if (item.contato1) {
                        arrProd[key].tentativa1 += 1
                    }

                    if (item.contato2) {
                        arrProd[key].tentativa2 += 1
                    }

                    if (item.contato3) {
                        arrProd[key].tentativa3 += 1
                    }
                }
            }

            return res.json(Object.values(arrProd))


        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },


    relatorioProdutivdadeMensalRnUe: async (req, res) => {
        try {

            const { mes } = req.params

            const rns = await Rn.find({
                dataConclusao: { $regex: mes }
            }).lean().sort({ dataConclusao: 1 })

            const ues = await UrgenciasEmergencia.find({
                dataConclusao: { $regex: mes }
            }).lean().sort({ dataConclusao: 1 })

            const arr = {}

            for (const item of rns) {
                const dataConclusao = moment(item.dataConclusao).format('DD/MM/YYYY')

                // Se o retorno for 'Sem sucesso de contato', atribua o analista como 'Cancelado'
                const responsavel = item.retorno === 'Sem sucesso de contato' ? 'Cancelado' : item.responsavel;

                const key = `${responsavel}-${dataConclusao}`

                if (!arr[key]) {
                    arr[key] = {
                        analista: responsavel,
                        data: dataConclusao,
                        quantidadeRn: 0,
                        quantidadeUe: 0,
                    }
                }

                arr[key].quantidadeRn += 1
            }

            for (const item of ues) {
                const dataConclusao = moment(item.dataConclusao).format('DD/MM/YYYY')

                // Se o retorno for 'Sem sucesso de contato', atribua o analista como 'Cancelado'
                const analista = item.retorno === 'Sem sucesso de contato' ? 'Cancelado' : item.analista;

                const key = `${analista}-${dataConclusao}`

                if (!arr[key]) {
                    arr[key] = {
                        analista: analista,
                        data: dataConclusao,
                        quantidadeUe: 0,
                        quantidadeRn: 0,
                    }
                }

                arr[key].quantidadeUe += 1
            }

            return res.json(Object.values(arr))
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    relatorioProdutividadeAnexosMensal: async (req, res) => {
        try {

            const { mes } = req.params

            const result = await DadosEntrevista.find({
                $or: [
                    { dataAnexado: { $regex: mes } },
                    { dataMandouImplantacao: { $regex: mes } }
                ]
            })

            const arr = {}

            for (const item of result) {
                const dataAnexado = moment(item.dataAnexado).format('DD/MM/YYYY')
                const dataMandouImplantacao = moment(item.dataMandouImplantacao).format('DD/MM/YYYY')

                if (item.quemAnexou) {
                    const keyAnexado = `${item.quemAnexou}-${dataAnexado}`

                    if (!arr[keyAnexado]) {
                        arr[keyAnexado] = {
                            analista: item.quemAnexou,
                            data: dataAnexado,
                            quantidadeAnexado: 0,
                            quantidadeImplantado: 0,
                            quantidadeMandouImplantacao: 0,
                        }
                    }

                    arr[keyAnexado].quantidadeAnexado += 1

                    if (item.implantado === 'Sim') {
                        arr[keyAnexado].quantidadeImplantado += 1
                    }
                }

                if (item.quemMandouImplantacao) {
                    const keyMandouImplantacao = `${item.quemMandouImplantacao}-${dataMandouImplantacao}`

                    if (!arr[keyMandouImplantacao]) {
                        arr[keyMandouImplantacao] = {
                            analista: item.quemMandouImplantacao,
                            data: dataMandouImplantacao,
                            quantidadeAnexado: 0,
                            quantidadeImplantado: 0,
                            quantidadeMandouImplantacao: 0,
                        }
                    }

                    arr[keyMandouImplantacao].quantidadeMandouImplantacao += 1
                }
            }

            return res.json(Object.values(arr))

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error',
                error
            })
        }
    },

    quantidadeAnalistasPorMes: async (req, res) => {
        try {

            const { mes } = req.params

            const diasUteis = countWeekdaysInMonth(mes.split('-')[0], mes.split('-')[1] - 1, holidays)

            let result = await DadosEntrevista.aggregate([
                {
                    $match: {
                        dataEntrevista: { $regex: mes },
                        responsavel: { $nin: ['Sem Sucesso de Contato!', 'Beneficiario Solicitou o Cancelamento'] },
                    }
                },
                {
                    $group: {
                        _id: '$responsavel',
                        total: { $sum: 1 },
                        diasTrabalhados: { $addToSet: "$dataEntrevista" }, // Adiciona a data (primeiros 10 caracteres de dataEntrevista) ao conjunto se ainda não estiver presente
                        houveDivergencia: { $sum: { $cond: [{ $eq: ["$houveDivergencia", "Sim"] }, 1, 0] } }
                    }
                }
            ])

            result = result.map(item => {
                return ({
                    analista: item._id,
                    total: item.total,
                    media: (item.total / diasUteis),
                    houveDivergencia: item.houveDivergencia,
                    mediaDivergencia: (item.houveDivergencia / item.total) * 100,
                })
            }).sort((a, b) => b.total - a.total)

            const media = result.reduce((acc, item) => acc + item.media, 0) / result.length
            const mediaDiasTrabalhados = result.reduce((acc, item) => acc + item.mediaDiasTrabalhados, 0) / result.length
            const mediaTotal = result.reduce((acc, item) => acc + item.total, 0) / result.length

            return res.json({
                result,
                mediaTotal,
                mediaDiasTrabalhados,
                media
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: "Internal Server Error"
            })
        }
    },

    filterEntrevistasRealizadas: async (req, res) => {
        try {

            const { pesquisa = '', limit = 100, page = 1, entrevistaQualidade = false } = req.body

            const skip = (page - 1) * limit

            if (entrevistaQualidade) {

                const result = await DadosEntrevista.find({
                    $or: [
                        { proposta: pesquisa },
                        { nome: { $regex: pesquisa, $options: 'i' } },
                        { cpf: { $regex: pesquisa, $options: 'i' } },
                    ],
                    entrevistaQualidade: true
                }).lean().limit(limit).skip(skip).sort({ dataEntrevista: -1 })

                const total = await DadosEntrevista.countDocuments({
                    $or: [
                        { proposta: pesquisa },
                        { nome: { $regex: pesquisa, $options: 'i' } },
                        { cpf: { $regex: pesquisa, $options: 'i' } },
                    ],
                    entrevistaQualidade: true
                })

                return res.json({
                    result,
                    total
                })

            } else {
                const result = await DadosEntrevista.find({
                    $or: [
                        { proposta: pesquisa },
                        { nome: { $regex: pesquisa, $options: 'i' } },
                        { cpf: { $regex: pesquisa, $options: 'i' } },
                    ]
                }).lean().limit(limit).skip(skip).sort({ dataEntrevista: -1 })

                const total = await DadosEntrevista.countDocuments({
                    $or: [
                        { proposta: pesquisa },
                        { nome: { $regex: pesquisa, $options: 'i' } },
                        { cpf: { $regex: pesquisa, $options: 'i' } },
                    ]
                })

                return res.json({
                    result,
                    total
                })
            }



        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: "Internal Server Error"
            })
        }
    },

    filterQueryDadosEntrevistas: async (req, res) => {
        try {

            const { query, page, limit } = req.body

            console.log(query, page, limit);

            let resultQuery = DadosEntrevista.find(query).lean().sort({ dataEntrevista: -1 })

            if (page && limit) {
                const skip = (page - 1) * limit
                resultQuery = resultQuery.limit(limit).skip(skip)
            }

            const result = await resultQuery

            const total = await DadosEntrevista.countDocuments(query)

            return res.json({
                result,
                total
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: "Internal Server Error"
            })
        }
    },

    filterProducao: async (req, res) => {
        try {

            const { data } = req.query

            // console.log(data);

            const entrevistas = await DadosEntrevista.find({
                dataEntrevista: { $regex: data },
            })
            const contarEntrevistas = await DadosEntrevista.find({
                dataEntrevista: { $regex: data },
            }).countDocuments()

            // console.log(contarEntrevistas)

            return res.status(200).json({ entrevistas, contarEntrevistas })
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: "Internal Server"
            })
        }
    },

    produtividadeAnexosIndividual: async (req, res) => {
        try {

            const { analista, mes } = req.params

            const totalAnexos = await DadosEntrevista.countDocuments({
                dataAnexado: { $regex: mes }
            })

            const totalImplantados = await DadosEntrevista.countDocuments({
                dataImplantado: { $regex: mes }
            })

            const totalMandouImplantacao = await DadosEntrevista.countDocuments({
                dataMandouImplantacao: { $regex: mes }
            })

            const anexos = await DadosEntrevista.countDocuments({
                quemAnexou: analista,
                dataAnexado: { $regex: mes }
            })

            const implantados = await DadosEntrevista.countDocuments({
                quemImplantou: analista,
                dataImplantado: { $regex: mes }
            })

            const mandouImplantacao = await DadosEntrevista.countDocuments({
                quemMandouImplantacao: analista,
                dataMandouImplantacao: { $regex: mes }
            })

            const analistaQueMaisAnexou = await DadosEntrevista.aggregate([
                {
                    $match: {
                        dataAnexado: { $regex: mes }
                    }
                },
                {
                    $group: {
                        _id: '$quemAnexou',
                        total: { $sum: 1 }
                    }
                },
                {
                    $sort: { total: -1 }
                },
                {
                    $limit: 1
                }
            ])

            const analistaQueMaisImplantou = await DadosEntrevista.aggregate([
                {
                    $match: {
                        dataImplantado: { $regex: mes }
                    }
                },
                {
                    $group: {
                        _id: '$quemImplantou',
                        total: { $sum: 1 }
                    }
                },
                {
                    $sort: { total: -1 }
                },
                {
                    $limit: 1
                }
            ])

            const analistaQueMaisMandouImplantacao = await DadosEntrevista.aggregate([
                {
                    $match: {
                        dataMandouImplantacao: { $regex: mes }
                    }
                },
                {
                    $group: {
                        _id: '$quemMandouImplantacao',
                        total: { $sum: 1 }
                    }
                },
                {
                    $sort: { total: -1 }
                },
                {
                    $limit: 1
                }
            ])


            return res.json({
                anexos,
                implantados,
                mandouImplantacao,
                analistaQueMaisAnexou,
                analistaQueMaisImplantou,
                analistaQueMaisMandouImplantacao,
                totalAnexos,
                totalImplantados,
                totalMandouImplantacao
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: "Internal Server",
                error
            })
        }
    },

    quantidadeEntrevistasPorMes: async (req, res) => {
        try {

            const { mes } = req.params

            const total = await DadosEntrevista.countDocuments({
                dataEntrevista: { $regex: mes }
            })

            const totalConcluidas = await DadosEntrevista.countDocuments({
                dataEntrevista: { $regex: mes },
                cancelado: { $ne: true }
            })

            const totalCanceladas = await DadosEntrevista.countDocuments({
                dataEntrevista: { $regex: mes },
                cancelado: true
            })

            const totalMesPassado = await DadosEntrevista.countDocuments({
                dataEntrevista: { $regex: moment(mes).subtract(1, 'months').format('YYYY-MM') }
            })

            const totalConcluidasMesPassado = await DadosEntrevista.countDocuments({
                dataEntrevista: { $regex: moment(mes).subtract(1, 'months').format('YYYY-MM') },
                cancelado: { $ne: true }
            })

            const totalCanceladasMesPassado = await DadosEntrevista.countDocuments({
                dataEntrevista: { $regex: moment(mes).subtract(1, 'months').format('YYYY-MM') },
                cancelado: true
            })

            const result = {
                total,
                totalConcluidas,
                totalCanceladas,
                totalMesPassado,
                totalConcluidasMesPassado,
                totalCanceladasMesPassado
            }

            return res.json(result)

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: "Internal Server Error"
            })
        }
    },

    dadosAnalaticoAnexos: async (req, res) => {
        try {

            const { mes } = req.params

            const totalAnexos = await DadosEntrevista.countDocuments({
                dataAnexado: { $regex: mes }
            })

            const totalEnviadosImplantacao = await DadosEntrevista.countDocuments({
                dataMandouImplantacao: { $regex: mes }
            })

            const totalImplantados = await DadosEntrevista.countDocuments({
                dataImplantado: { $regex: mes }
            })

            const situacoesAmil = await DadosEntrevista.aggregate([
                {
                    $match: {
                        dataMandouImplantacao: { $regex: mes }
                    }
                },
                {
                    $group: {
                        _id: '$situacaoAmil',
                        total: { $sum: 1 }
                    }
                }
            ])

            const producaoAnexos = await DadosEntrevista.aggregate([
                {
                    $match: {
                        dataAnexado: { $regex: mes }
                    }
                },
                {
                    $group: {
                        _id: '$quemAnexou',
                        total: { $sum: 1 }
                    }
                }
            ])

            const implantacao = await DadosEntrevista.aggregate([
                {
                    $match: {
                        dataMandouImplantacao: { $regex: mes }
                    }
                },
                {
                    $group: {
                        _id: '$quemMandouImplantacao',
                        total: { $sum: 1 }
                    }
                }
            ])

            const implantados = await DadosEntrevista.aggregate([
                {
                    $match: {
                        dataImplantado: { $regex: mes }
                    }
                },
                {
                    $group: {
                        _id: '$quemImplantou',
                        total: { $sum: 1 }
                    }
                }
            ])

            let producao = []

            for (const item of producaoAnexos) {
                const index = producao.findIndex(implantou => implantou._id === item._id)
                if (index !== -1) {
                    producao[index].totalAnexos = item.total
                } else {
                    producao.push({
                        analista: item._id,
                        totalAnexos: item.total,
                        totalImplantacao: 0,
                        totalImplantados: 0
                    })
                }
            }

            for (const item of implantados) {
                const index = producao.findIndex(producao => producao.analista === item._id)
                if (index !== -1) {
                    producao[index].totalImplantados = item.total
                } else {
                    producao.push({
                        analista: item._id,
                        totalAnexos: 0,
                        totalImplantacao: 0,
                        totalImplantados: item.total
                    })
                }
            }

            for (const item of implantacao) {
                const index = producao.findIndex(producao => producao.analista === item._id)
                if (index !== -1) {
                    producao[index].totalImplantacao = item.total
                } else {
                    producao.push({
                        analista: item._id,
                        totalAnexos: 0,
                        totalImplantacao: item.total,
                        totalImplantados: 0
                    })
                }
            }

            producao = producao.sort((a, b) => b.totalAnexos - a.totalAnexos)

            producao = producao.filter(item => item.analista)

            return res.json({
                totalAnexos,
                totalEnviadosImplantacao,
                totalImplantados,
                situacoesAmil,
                producao
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: "Internal Server Error"
            })
        }
    },

    producaoIndividualTele: async (req, res) => {
        try {

            const { analista, mes } = req.params

            const minhasEntrevistas = await DadosEntrevista.countDocuments({
                dataEntrevista: { $regex: mes },
                responsavel: analista
            })

            const minhasEntrevistasMesPassado = await DadosEntrevista.countDocuments({
                dataEntrevista: { $regex: moment(mes).subtract(1, 'months').format('YYYY-MM') },
                responsavel: analista
            })

            const qtdDiaUtil = countWeekdaysInMonth(mes.split('-')[0], mes.split('-')[1] - 1, holidays)

            const analistaComMelhorDesempenho = await DadosEntrevista.aggregate([
                {
                    $match: {
                        dataEntrevista: { $regex: mes },
                        responsavel: { $ne: 'Sem Sucesso de Contato!' }
                    }
                },
                {
                    $group: {
                        _id: '$responsavel',
                        total: { $sum: 1 }
                    }
                },
                {
                    $sort: { total: -1 }
                },
                {
                    $limit: 1
                }
            ])

            return res.json({
                minhasEntrevistas,
                minhasEntrevistasMesPassado,
                qtdDiaUtil,
                analistaComMelhorDesempenho
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: "Internal Server Error"
            })
        }
    },

    comparativoProducao: async (req, res) => {
        try {

            const { mes, analista } = req.params

            const analistaComMaiorDesempenho = await DadosEntrevista.aggregate([
                {
                    $match: {
                        dataEntrevista: { $regex: mes },
                        responsavel: { $ne: 'Sem Sucesso de Contato!' }
                    }
                },
                {
                    $group: {
                        _id: '$responsavel',
                        total: { $sum: 1 }
                    }
                },
                {
                    $sort: { total: -1 }
                },
                {
                    $limit: 1
                }
            ])

            const datasEntrevistas = await DadosEntrevista.find({
                dataEntrevista: { $regex: mes },
            }, {
                dataEntrevista: 1
            }).lean()

            const totalAnalista = await DadosEntrevista.find({
                dataEntrevista: { $regex: mes },
                responsavel: analista
            }).lean()

            const entrevistasAnalistaQueMaisAgendou = await DadosEntrevista.find({
                dataEntrevista: { $regex: mes },
                responsavel: analistaComMaiorDesempenho[0]._id
            }).lean()

            let dates = []

            for (const item of datasEntrevistas) {
                if (!dates.includes(item.dataEntrevista)) {
                    dates.push(item.dataEntrevista)
                }
            }

            dates = dates.sort((a, b) => {
                return new Date(a) - new Date(b)
            })

            let series = [
                {
                    name: analista,
                    data: []
                },
                {
                    name: analistaComMaiorDesempenho[0]._id,
                    data: []
                }
            ]

            for (const date of dates) {
                const total = totalAnalista.filter(item => item.dataEntrevista === date).length
                const totalComMaiorDesempenho = entrevistasAnalistaQueMaisAgendou.filter(item => item.dataEntrevista === date).length

                series[0].data.push(total)
                series[1].data.push(totalComMaiorDesempenho)
            }

            dates = dates.map(date => moment(date).format('DD/MM/YYYY'))

            return res.json({
                dates,
                series
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: "Internal Server Error"
            })
        }
    },

    quantidadeDivergenciaPorMes: async (req, res) => {
        try {

            const { mes, analista } = req.params

            const totalDivergenciaAnalista = await DadosEntrevista.countDocuments({
                dataEntrevista: { $regex: mes },
                responsavel: analista,
                houveDivergencia: 'Sim'
            })

            const totalSemDivergenciaAnalista = await DadosEntrevista.countDocuments({
                dataEntrevista: { $regex: mes },
                responsavel: analista,
                houveDivergencia: 'Não'
            })

            const totalDivergencia = await DadosEntrevista.countDocuments({
                dataEntrevista: { $regex: mes },
                houveDivergencia: 'Sim'
            })

            const totalSemDivergencia = await DadosEntrevista.countDocuments({
                dataEntrevista: { $regex: mes },
                houveDivergencia: 'Não'
            })

            return res.json({
                totalDivergenciaAnalista,
                totalSemDivergenciaAnalista,
                totalDivergencia,
                totalSemDivergencia
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: "Internal Server Error",
                error
            })
        }
    },

    alterarDivergenciaAnexo: async (req, res) => {
        try {

            const { id, divergenciaAnexo, proposta, nome } = req.body

            console.log(id, divergenciaAnexo, proposta, nome);

            if (id) {

                const result = await DadosEntrevista.findByIdAndUpdate(id, {
                    divergenciaAnexo
                })

                return res.json(result)
            }

            const result = await DadosEntrevista.findOneAndUpdate({
                proposta,
                nome
            }, {
                divergenciaAnexo
            })

            return res.json(result)

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: "Internal Server Error"
            })
        }
    },

    alterarRetrabalhoEntrevista: async (req, res) => {
        try {

            const { id, retrabalho, proposta, nome } = req.body

            if (id) {

                const result = await DadosEntrevista.findByIdAndUpdate(id, {
                    retrabalho
                })

                return res.json(result)
            }

            const result = await DadosEntrevista.findOneAndUpdate({
                proposta,
                nome
            }, {
                retrabalho
            })

            return res.json(result)

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: "Internal Server Error"
            })
        }
    }
}

const feriados = [
    moment('2022-01-01'),
    moment('2022-04-21'),
    moment('2022-05-01'),
    moment('2022-09-07'),
    moment('2022-10-12'),
    moment('2022-11-02'),
    moment('2022-11-15'),
    moment('2022-12-25'),
    moment('2023-01-01'),
    moment('2023-02-20'),
    moment('2023-02-21'),
    moment('2023-02-22'),
    moment('2023-04-07'),
    moment('2023-04-21'),
    moment('2023-05-01'),
    moment('2023-06-08'),
    moment('2023-09-07'),
    moment('2023-10-12'),
    moment('2023-11-02'),
    moment('2023-11-15'),
    moment('2023-12-25'),
    moment('2024-01-01'),
    moment('2024-02-12'),
    moment('2024-02-13'),
    moment('2024-03-29'),
    moment('2024-04-21'),
    moment('2024-05-01'),
    moment('2024-05-30'),
    moment('2024-09-07'),
    moment('2024-10-12'),
    moment('2024-11-02'),
    moment('2024-11-15'),
    moment('2024-11-20'),
    moment('2024-12-25'),
];

const holidays = [
    '2022-01-01',
    '2022-04-21',
    '2022-05-01',
    '2022-09-07',
    '2022-10-12',
    '2022-11-02',
    '2022-11-15',
    '2022-12-25',
    '2023-01-01',
    '2023-02-20',
    '2023-02-21',
    '2023-02-22',
    '2023-04-07',
    '2023-04-21',
    '2023-05-01',
    '2023-06-08',
    '2023-09-07',
    '2023-10-12',
    '2023-11-02',
    '2023-11-15',
    '2023-12-25',
    '2024-01-01',
    '2024-02-12',
    '2024-02-13',
    '2024-03-29',
    '2024-04-21',
    '2024-05-01',
    '2024-05-30',
    '2024-09-07',
    '2024-10-12',
    '2024-11-02',
    '2024-11-15',
    '2024-11-20',
    '2024-12-25',
];

function calcularDiasUteis(dataInicio, dataFim, feriados) {
    let diasUteis = 0;
    let dataAtual = moment(dataInicio);

    while (dataAtual.isSameOrBefore(dataFim, 'day')) {
        if (dataAtual.isBusinessDay() && !feriados.some(feriado => feriado.isSame(dataAtual, 'day'))) {
            diasUteis++;
        }
        dataAtual.add(1, 'day');
    }

    return diasUteis - 1;
}

function countWeekdaysInMonth(year, month, holidays) {
    let count = 0;
    let date = new Date(year, month, 1);
    while (date.getMonth() === month) {
        if (date.getDay() !== 0 && date.getDay() !== 6) {
            // Dia da semana não é sábado nem domingo
            let dateString = date.toISOString().split('T')[0]; // Formato: 'yyyy-mm-dd'
            if (!holidays.includes(dateString)) {
                // A data não é um feriado
                count++;
            }
        }
        date.setDate(date.getDate() + 1);
    }
    return count;
}

function extrairNumerosJuntos(str) {
    const numeros = str.match(/\d+/g);
    if (numeros) {
        return numeros.join('');
    } else {
        return '';
    }
}
