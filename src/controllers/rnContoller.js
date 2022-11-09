const mongoose = require('mongoose')
const Rn = mongoose.model('Rn')
const moment = require('moment')

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

                vigencia = moment(vigencia).format('DD/MM/YYYY')

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


                const status = 'Em andamento'

                const resultado = {
                    data,
                    beneficiario,
                    mo,
                    proposta,
                    vigencia,
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
                    status

                }


                const newRn = await Rn.create(resultado)

                quantidade++

            }

            return res.status(200).json({ message: `Foram inseridas ${quantidade} novas Rns` })
        } catch (error) {
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

            return res.status(200).json(rn)

        } catch (error) {
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
                dataContato1: data.dataContato1,
                dataContato2: data.dataContato2,
                dataContato3: data.dataContato3,
                horarioContato1: data.horarioContato1,
                horarioContato2: data.horarioContato2,
                horarioContato3: data.horarioContato3,
                observacoes: data.observacoes,
                email: data.email,
                status: 'Concluido',
                dataConclusao: new Date()
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

                const result = await Rn.findOneAndUpdate({
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