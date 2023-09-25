const mongoose = require('mongoose')
const Rn = require('../models/TeleEntrevista/Rn')
const Horario = require('../models/TeleEntrevista/Horario')
const moment = require('moment')
const momentBusiness = require('moment-business-days')

module.exports = {
    upload: async (req, res) => {
        try {

            const result = req.body

            // console.log(result.result);

            let quantidade = 0

            for (const e of result.result) {
                let data = ExcelDateToJSDate(e.DATA)
                data.setDate(data.getDate() + 1)

                data = moment(data).format('DD/MM/YYYY')

                const beneficiario = e['BENFICIÁRIO'];

                const mo = e.MO

                const proposta = e.PROPOSTA

                let vigencia = ExcelDateToJSDate(e.VIGENCIA)
                vigencia.setDate(vigencia.getDate() + 1)
                vigencia = moment(vigencia).format('YYYY-MM-DD')

                let vigenciaLpl = moment().businessAdd(2).format('YYYY-MM-DD')

                const pedido = e.PEDIDO

                const tipo = e.TIPO

                const filial = e.FILIAL

                const idade = e.IDADE

                let dataRecebimento = ExcelDateToJSDate(e['DATA RECEBIMENTO DO PEDIDO'])
                dataRecebimento.setDate(dataRecebimento.getDate() + 1)

                dataRecebimento = moment(dataRecebimento).format('DD/MM/YYYY')

                const procedimento = e.PROCEDIMENTO

                const doenca = e['DOENÇA']

                const cid = e.CID

                const periodo = e['PERÍODO DA DOENÇA']

                const prc = e.PRC

                const telefones = e['TELEFONES BENEFICIARIO']

                const email = e['EMAIL BENEFICIARIO']

                const analistaAmil = e.ANALISTA

                const status = 'Em andamento'

                const resultado = {
                    data,
                    beneficiario,
                    mo,
                    proposta,
                    vigencia,
                    vigenciaLpl,
                    pedido,
                    tipo,
                    filial,
                    idade,
                    dataRecebimento,
                    procedimento,
                    doenca,
                    cid,
                    periodo,
                    prc,
                    telefones,
                    email,
                    status,
                    faturado: 'Não faturado',
                    analistaAmil
                }

                await Rn.create(resultado)

                quantidade++

            }

            return res.status(200).json({ message: `Foram inseridas ${quantidade} novas Rns` })
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    show: async (req, res) => {

        try {
            const rns = await Rn.find()

            return res.json(rns)
        } catch (error) {
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    search: async (req, res) => {
        try {

            const { id } = req.params

            console.log(id);

            const rn = await Rn.findById({
                _id: id
            })

            return res.json(rn)

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    update: async (req, res) => {
        try {
            const data = req.body


            // console.log(data);

            const rn = await Rn.findByIdAndUpdate({
                _id: data.id
            }, {
                dataContato1: data.dataContato1,
                dataContato2: data.dataContato2,
                dataContato3: data.dataContato3,
                horarioContato1: data.horarioContato1,
                horarioContato2: data.horarioContato2,
                horarioContato3: data.horarioContato3,
                observacoes: data.observacoes,
                email: data.email
            })

            console.log(rn);


            return res.status(200).json(rn)

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    concluir: async (req, res) => {
        try {
            const data = req.body

            // console.log(data);

            const rn = await Rn.findByIdAndUpdate({
                _id: data.id
            }, {
                observacoes: data.observacoes,
                email: data.email,
                status: 'Concluido',
                dataConclusao: moment(new Date()).format('YYYY-MM-DD'),
                responsavel: req.user
            })

            return res.status(200).json(rn)
        } catch (error) {
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    report: async (req, res) => {
        try {
            const rns = await Rn.find()

            const date = new Date()
            let hoje = moment(date).format('DD/MM/YYYY')

            const resp = []

            for (const e of rns) {
                if (e.createdAt !== undefined) {
                    let data = moment(e.createdAt).format('DD/MM/YYYY')
                    console.log(`data: ${data} - hoje: ${hoje}`);
                    if (data === hoje) {
                        resp.push(e)
                    }
                }
            }

            return res.json(resp)
        } catch (error) {
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    searchProposta: async (req, res) => {
        try {

            const proposta = req.params.proposta

            const result = await Rn.find({ proposta: { '$regex': proposta } })

            return res.status(200).json(result)

        } catch (error) {

            console.log(error);

            return res.status(500).json({
                error: "Internal server error.",
                error
            })
        }
    },

    updateConfirmadas: async (req, res) => {
        try {

            const { sendData } = req.body

            for (const item of sendData) {

                if (item.respostaBeneficiario === 'AG/REEMB') {
                    item.respostaBeneficiario = 'Não'
                }

                await Rn.findOneAndUpdate({
                    proposta: item.proposta
                }, {
                    respostaBeneficiario: item.respostaBeneficiario
                })

            }

            return res.status(200).json({
                sendData
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error.",
                error
            })
        }
    },

    naoAgendadas: async (req, res) => {
        try {

            const result = await Rn.find({
                agendado: { $ne: 'Agendado' },
                status: { $ne: 'Concluido' }
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

    agendadas: async (req, res) => {
        try {

            const rns = await Rn.find({
                agendado: 'Agendado',
                status: { $ne: 'Concluido' }
            })

            return res.status(200).json({
                rns
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

            const { id } = req.params

            console.log(id);

            await Rn.deleteOne({
                _id: id
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

    reagendar: async (req, res) => {
        try {
            const { id } = req.body

            const dadosProposta = await Rn.findById({
                _id: id
            })

            console.log(dadosProposta);

            let split = dadosProposta.dataEntrevista.split(' ')
            let dataEntrevista = split[0]
            const horario = split[1]

            console.log(dataEntrevista, horario);

            await Horario.findOneAndUpdate({
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

            const result = await Rn.findOneAndUpdate({
                _id: id
            }, {
                dataEntrevista: '',
                agendado: '',
                enfermeiro: ''
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

    alterarTelefone: async (req, res) => {
        try {

            const { id, telefone } = req.body

            const result = await Rn.findByIdAndUpdate({
                _id: id
            }, {
                telefones: telefone
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

    concluidas: async (req, res) => {
        try {

            const result = await Rn.find({
                status: 'Concluido'
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

    cancelar: async (req, res) => {
        try {

            const { id } = req.body

            const result = await Rn.findByIdAndUpdate({
                _id: id
            }, {
                observacoes: 'Sem sucesso de contato',
                status: 'Concluido',
                dataConclusao: moment().format('YYYY-MM-DD'),
                responsavel: 'Cancelado',
                cancelado: 'Cancelado'
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

    tentativaContato: async (req, res) => {
        try {

            const { id, tentativa } = req.body

            switch (tentativa) {
                case 'tentativa 1':
                    await Rn.findByIdAndUpdate({
                        _id: id
                    }, {
                        dataContato1: moment().format('YYYY-MM-DD'),
                        horarioContato1: moment().format('HH:mm')
                    })
                    break;
                case 'tentativa 2':
                    await Rn.findByIdAndUpdate({
                        _id: id
                    }, {
                        dataContato2: moment().format('YYYY-MM-DD'),
                        horarioContato2: moment().format('HH:mm')
                    })
                    break;
                case 'tentativa 3':
                    await Rn.findByIdAndUpdate({
                        _id: id
                    }, {
                        dataContato3: moment().format('YYYY-MM-DD'),
                        horarioContato3: moment().format('HH:mm')
                    })
                    break;
                default:
                    break;
            }

            return res.json({
                msg: 'Tentativa de contato feita com sucesso'
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    duplicada: async (req, res) => {
        try {

            const { id } = req.body

            await Rn.updateOne({
                _id: id
            }, {
                responsavel: 'Duplicada',
                status: 'Concluido'
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

    filter: async (req, res) => {
        try {

            const { pesquisa } = req.params

            const rns = await Rn.find({
                $or: [
                    { beneficiario: { $regex: pesquisa } },
                    { mo: { $regex: pesquisa } },
                    { proposta: { $regex: pesquisa } },
                    { pedido: { $regex: pesquisa } }
                ]
            })

            return res.json(rns)

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
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

function ajustarData(data) {
    const arrAux = data.split('/')

    const dia = arrAux[0]
    const mes = arrAux[1]
    const ano = arrAux[2]

    return `${ano}-${mes}-${dia}`

}