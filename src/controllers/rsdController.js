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

                let file = fs.readFileSync(req.file.path)

                const workbook = xlsx.read(file, { type: 'array' })

                const firstSheetName = workbook.SheetNames[0]

                const worksheet = workbook.Sheets[firstSheetName]

                const result = xlsx.utils.sheet_to_json(worksheet)

                if (req.file.originalname.indexOf('PF') === 10) {
                    console.log('fila pf');

                    let mapCpfs = new Map()
                    let arrPedidos = []

                    result.forEach(e => {

                        if (e['Situação'] == 'Aguardando documentação' ||
                            e['Situação'] == 'Documento recebido na Amil' ||
                            e['Situação'] == 'Em processamento' ||
                            e['Situação'] == 'Pedido Cadastrado' ||
                            e['Situação'] == 'Aguardando documento original' ||
                            e['Situação'] == 'Em Análise Técnica'
                        ) {

                            let rep = e['Beneficiário'].replace(' - ', '-')
                            let split = rep.split('-')
                            let mo = split[0]
                            let beneficiario = split[1]

                            arrPedidos.push([
                                e[' Reembolso'],
                                e['Situação'],
                                e['Data do Pedido'],
                                e['Data Prevista Pagamento'],
                                e['Data Pagamento'],
                                e['Número do Titulo'],
                                e['CPF do Favorecido'],
                                mo,
                                beneficiario,
                                e['Valor Apresentado'],
                                e['Valor Reembolsado'],
                                e.Protocolo,
                            ])

                            if (mapCpfs.has(e['CPF do Favorecido'])) {
                                mapCpfs.set(e['CPF do Favorecido'], mapCpfs.get(e['CPF do Favorecido']) + e['Valor Apresentado'])
                            } else {
                                mapCpfs.set(e['CPF do Favorecido'], e['Valor Apresentado'])
                            }
                        }
                    })

                    let arr = []

                    arrPedidos.forEach(val => {
                        for (const [cpf, value] of mapCpfs) {
                            if (value >= 20000) {
                                if (val[6] == cpf) {
                                    arr.push(val)
                                    break
                                }
                            }
                        }
                    })


                    // pedidosBanco.forEach(e => {
                    //     console.log(e.numero);
                    // })

                    let teste = 0

                    arr.forEach(e => {
                        pedidosBanco.forEach(item => {
                            if (e[0] == item.numero) {
                                teste++
                                return
                            }
                        })
                    })


                    console.log(teste);


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