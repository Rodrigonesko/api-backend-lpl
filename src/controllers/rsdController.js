const mongoose = require('mongoose')
const Pedido = mongoose.model('Pedido')
const Pessoa = mongoose.model('Pessoa')
const Protocolo = mongoose.model('Protocolo')
const Operador = mongoose.model('Operador')
const Clinica = mongoose.model('Clinica')

const moment = require('moment')
const fs = require('fs')
const multer = require('multer')
const os = require('os')

const xlsx = require('xlsx')

const uploadRsd = multer({ dest: os.tmpdir() }).single('file')

module.exports = {
    upload: async (req, res) => {
        try {

            const pedidosBanco = await Pedido.find()

            uploadRsd(req, res, async (err) => {

                console.log(req.file.originalname);

                let file = fs.readFileSync(req.file.path, 'utf-8')

                const workbook = xlsx.read(file, { type: 'array' })

                const firstSheetName = workbook.SheetNames[0]

                const worksheet = workbook.Sheets[firstSheetName]

                const result = xlsx.utils.sheet_to_json(worksheet)



                if (req.file.originalname.indexOf('PF') === 10) {
                    console.log('fila pf');

                    let arrCpfs = []

                    result.forEach(e => {

                        if (e['Situação'] == 'Aguardando documentação' ||
                            e['Situação'] == 'Documento recebido na Amil' ||
                            e['Situação'] == 'Em processamento' ||
                            e['Situação'] == 'Pedido Cadastrado' ||
                            e['Situação'] == 'Aguardando documento original' ||
                            e['Situação'] == 'Em Análise Técnica'
                        ) {
                            //arrCpfs.push([e['CPF do Favorecido'], e['Valor Apresentado']])
                            console.log(e['Valor Apresentado']);
                        }

                    })

                    //console.log(arrCpfs);

                } else {
                    console.log('fila pj');
                }

                return res.status(200).json({
                    msg: 'ola'
                })
            })
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    }
}