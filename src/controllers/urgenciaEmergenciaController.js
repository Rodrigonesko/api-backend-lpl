const mongoose = require('mongoose')
const UrgenciasEmergencia = mongoose.model('UrgenciasEmergencia')

const moment = require('moment')
const path = require('path')
const fs = require('fs')
const multer = require('multer')
const os = require('os')
const xlsx = require('xlsx')

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = './uploads/urgenciaEmergencia/'
        if (!fs.existsSync(dir)) {
            fs.mkdir(dir, (err) => {
                if (err) {
                    console.log("Deu ruim...");
                    return
                }
                console.log("Diretório criado!")
            });
        }
        cb(null, dir)
    },

    filename: (req, file, cb) => {
        cb(null, 'upload.xlsx')
    }

})

const uploadUrg = multer({ storage }).single('file')

module.exports = {
    upload: async (req, res) => {
        try {

            let quantidade = 0

            uploadUrg(req, res, async (err) => {
                console.log(req.file.originalname);

                let file = fs.readFileSync(req.file.path)

                const workbook = xlsx.read(file, { type: 'array' })

                const firstSheetName = workbook.SheetNames[0]

                const worksheet = workbook.Sheets[firstSheetName]

                let result = xlsx.utils.sheet_to_json(worksheet)

                for (const item of result) {
                    const find = await UrgenciasEmergencia.findOne({
                        proposta: item['PROPOSTA '],
                        nomeAssociado: item.NOME_ASSOC
                    })

                    if (!find) {
                        const dataRecebimento = moment(new Date()).format('YYYY-MM-DD')
                        const numAssociado = item.NUM_ASSOC
                        const proposta = item['PROPOSTA ']
                        let dataInclusao = ExcelDateToJSDate(item.DATA_INCLUSAO)
                        dataInclusao.setDate(dataInclusao.getDate() + 1)
                        dataInclusao = moment(dataInclusao).format('YYYY-MM-DD')
                        const nomeAssociado = item.NOME_ASSOC
                        let dataNascimento = ExcelDateToJSDate(item.DATA_NASC)
                        dataNascimento.setDate(dataNascimento.getDate() + 1)
                        dataNascimento = moment(dataNascimento).format('YYYY-MM-DD')
                        const idade = item.IDADE
                        const responsavel = item['RESPONSÁVEL']
                        const telefone = item['TEL CTTO']
                        const email = item.EMAIL
                        let dataSolicitacao = ExcelDateToJSDate(item.DATA_SOLICITACAO)
                        dataSolicitacao.setDate(dataSolicitacao.getDate() + 1)
                        dataSolicitacao = moment(dataSolicitacao).format('YYYY-MM-DD')
                        const nomePrestador = item.NOME_PRESTADOR
                        const cid = item.CID
                        const descricaoCid = item.NOM_CID_PRIN_AUTORIZ
                        const sitAutoriz = item.SIT_AUTORIZ
                        const relatorioMedico = item['INF RELATÓRIO MÉDICO']
                        const obsUnder = item[' OBS UNDER']

                        const obj = {
                            dataRecebimento,
                            numAssociado,
                            proposta,
                            dataInclusao,
                            nomeAssociado,
                            dataNascimento,
                            idade,
                            responsavel,
                            telefone,
                            email,
                            dataSolicitacao,
                            nomePrestador,
                            cid,
                            descricaoCid,
                            sitAutoriz,
                            relatorioMedico,
                            obsUnder,
                            status: 'Andamento'
                        }

                        await UrgenciasEmergencia.create(
                            obj
                        )

                        quantidade++

                    }
                }

                console.log(quantidade);

                return res.status(200).json({
                    quantidade
                })
            })


        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    mostrarAndamento: async (req, res) => {
        try {
            const propostas = await UrgenciasEmergencia.find({
                status: 'Andamento'
            })

            console.log(propostas);

            return res.status(200).json({
                propostas
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    mostrarTodas: async (req, res) => {
        try {

            const propostas = await UrgenciasEmergencia.find()

            console.log(propostas);

            return res.status(200).json({
                propostas
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    mostrarDadosProposta: async (req, res) => {
        try {

            const { id } = req.params

            const proposta = await UrgenciasEmergencia.findById({
                _id: id
            })

            return res.status(200).json({
                proposta
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    salvarInfo: async (req, res) => {
        try {

            const {id} = req.body

            return res.status(200).json({
                msg: 'Ok'
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    concluir: async (req, res) => {
        try {

            const {id} = req.body

            return res.status(200).json({
                msg: 'Ok'
            })

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