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

                const pedido = e['PEDIDO/PROPOSTA']

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
                    email
                }

                console.log(resultado);

                const newRn = await Rn.create(resultado)

                quantidade++

                console.log(newRn);
            }

            return res.status(200).json({ message: `Foram inseridas ${quantidade} novas Rns` })
        } catch (error) {
            console.log(error);
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

            const proposta = req.params

            const rn = await Rn.findOne(proposta)

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

            console.log(data);

            const rn = await Rn.findOneAndUpdate()

            return res.status(200).json(data)

        } catch (error) {
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