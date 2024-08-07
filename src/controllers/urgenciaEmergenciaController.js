const mongoose = require('mongoose')
const UrgenciasEmergencia = mongoose.model('UrgenciasEmergencia')
const User = mongoose.model('User')

const moment = require('moment')
const fs = require('fs')
const multer = require('multer')
const xlsx = require('xlsx')

//Onde armazena o arquivo da urgencia e emergencia

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = './uploads/urgenciaEmergencia/'
        if (!fs.existsSync(dir)) {
            fs.mkdir(dir, (err) => {
                if (err) {
                    console.log("Algo deu errado", err);
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

    /**
* Upload do arquivo e inserção no banco das UEs
*
* @route POST /urgenciaEmergencia/upload
* @returns {object} quantidade de propostas inseridas.
* @throws {error} Erro.
*/

    upload: async (req, res) => {
        try {

            let quantidade = 0

            uploadUrg(req, res, async (err) => {    //Busca o arquivo
                console.log(req.file.originalname);

                let file = fs.readFileSync(req.file.path)

                //O código abaixo usando a biblioteca xlsx serve para ler o arquivo xlsx fazendo um array de objetos

                const workbook = xlsx.read(file, { type: 'array' })

                const firstSheetName = workbook.SheetNames[0]

                const worksheet = workbook.Sheets[firstSheetName]

                let result = xlsx.utils.sheet_to_json(worksheet)

                for (const item of result) {
                    const find = await UrgenciasEmergencia.findOne({
                        pedido: item.NUM_PEDIDO,
                        nomeAssociado: item.NOME_ASSOCIADO
                    })

                    if (!find) {

                        //Função ExcelDateTOJSDate serve para transformar a data do excel em data

                        const mes = item['MÊS']
                        let data = ExcelDateToJSDate(item.DATA)
                        data.setDate(data.getDate() + 1)
                        data = moment(data).format('YYYY-MM-DD')
                        const numAssociado = item.NUM_ASSOCIADO
                        const nomeAssociado = item.NOME_ASSOCIADO
                        let dataNascimento = ExcelDateToJSDate(item.DATA_NASCIMENTO)
                        dataNascimento.setDate(dataNascimento.getDate() + 1)
                        dataNascimento = moment(dataNascimento).format('YYYY-MM-DD')
                        const idade = item.IDADE
                        let dataAdesao = ExcelDateToJSDate(item.DATA_ADESAO)
                        dataAdesao.setDate(dataAdesao.getDate() + 1)
                        dataAdesao = moment(dataAdesao).format('YYYY-MM-DD')
                        const telefone = item.NUM_TELEFONE
                        const email = item.EMAIL
                        const prc = item.COD_PRC
                        const pedido = item.PEDIDO

                        const nomePrestador = item.PRESTADOR
                        const cidPrin = item.CID ?? item['CID P/ IMPUTAR']
                        const relatorioMedico = item.PATOLOGIA ?? item['ARGUMENTOS/PATOLOGIA INF EM RELATORIO MEDICO']
                        let dataAtendimento = ExcelDateToJSDate(item['DT ATENDIMENTO'])
                        dataAtendimento.setDate(dataAtendimento.getDate() + 1)
                        dataAtendimento = moment(dataAtendimento).format('YYYY-MM-DD')

                        const dataRecebimento = moment().format('YYYY-MM-DD')

                        if (cidPrin === undefined || relatorioMedico === undefined) {
                            return res.status(500).json({
                                error: "CID ou Relatório médico não informado"
                            })
                        }

                        const obj = {
                            mes,
                            data,
                            numAssociado,
                            nomeAssociado,
                            dataNascimento,
                            idade,
                            dataAdesao,
                            telefone,
                            email,
                            prc,
                            pedido,
                            nomePrestador,
                            cidPrin,
                            relatorioMedico,
                            dataAtendimento,
                            dataRecebimento,
                            status: 'Andamento',
                            faturado: 'Não faturado'
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

    /**
* Mostra UEs em andamento
*
* @route GET /urgenciaEmergencia/andamento
* @returns {object} Propostas em andamento.
* @throws {error} Erro.
*/

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

    /**
* Mostra UEs para anexar
*
* @route GET /urgenciaEmergencia/anexar
* @returns {object} Propostas em anexar.
* @throws {error} Erro.
*/


    mostrarAnexar: async (req, res) => {
        try {
            const propostas = await UrgenciasEmergencia.find({
                status: 'Anexar'
            })

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

    /**
* Mostra UEs concluidas
*
* @route GET /urgenciaEmergencia/concluidas
* @returns {object} Propostas em concluidas.
* @throws {error} Erro.
*/


    mostrarConcluidas: async (req, res) => {
        try {

            const { page = 1, limit = 25 } = req.query
            let skip = (page - 1) * limit

            const propostas = await UrgenciasEmergencia.find({
                status: { $ne: 'Andamento' }
            }).skip(skip).limit(limit)
            const total = await UrgenciasEmergencia.find({
                status: { $ne: 'Andamento' }
            }).countDocuments()

            return res.status(200).json({
                propostas,
                total
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    /**
* Mostra UEs
*
* @route GET /urgenciaEmergencia/todas
* @returns {object} Propostas
* @throws {error} Erro.
*/

    mostrarTodas: async (req, res) => {
        try {

            const propostas = await UrgenciasEmergencia.find()

            return res.status(200).json({ propostas })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    /**
* Mostra informações de determinada UE
*
* @route GET /urgenciaEmergencia/detalhes/:id
* @returns {object} Proposta
* @throws {error} Erro.
*/

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

    /**
* Salva informações de determinada UE
*
* @route PUT /urgenciaEmergencia/salvarInfo
* @returns {object} Proposta
* @throws {error} Erro.
*/

    salvarInfo: async (req, res) => {
        try {

            const { id, obj } = req.body

            const proposta = await UrgenciasEmergencia.findByIdAndUpdate({
                _id: id
            }, obj)

            console.log(proposta);

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


    /**
* Conclui IE
*
* @route PUT /urgenciaEmergencia/concluir
* @returns {object} Proposta
* @throws {error} Erro.
*/


    concluir: async (req, res) => {
        try {

            const { id, obj } = req.body

            const proposta = await UrgenciasEmergencia.findByIdAndUpdate({
                _id: id
            }, {
                contato1: obj.contato1,
                contato2: obj.contato2,
                contato3: obj.contato3,
                telefone: obj.telefone,
                retorno: obj.retorno,
                observacoes: obj.observacoes,
                status: 'Concluído',
                analista: req.user,
                dataConclusao: moment(new Date()).format('YYYY-MM-DD')
            })

            console.log(proposta);

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

    /**
* Conclui IE
*
* @route PUT /urgenciaEmergencia/concluirAnexo
* @returns {object} Proposta
* @throws {error} Erro.
*/

    concluirAnexo: async (req, res) => {
        try {

            const { id } = req.body

            const proposta = await UrgenciasEmergencia.findByIdAndUpdate({
                _id: id
            }, {
                status: 'Concluído'
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

    /**
* Mostra produção de determinada data dos analistas
*
* @route GET /urgenciaEmergencia/producao/:data
* @returns {object} Producao
* @throws {error} Erro.
*/

    producao: async (req, res) => {
        try {

            const { data } = req.params

            const analistas = await User.find({
                enfermeiro: true
            })

            let producao = []

            for (const item of analistas) {
                const count = await UrgenciasEmergencia.find({
                    analista: item.name,
                    dataConclusao: data
                }).count()

                producao.push({
                    analista: item.name,
                    quantidade: count
                })
            }

            const total = await UrgenciasEmergencia.find({
                dataConclusao: data
            }).count()

            return res.status(200).json({
                producao,
                total
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },


    /**
* Mostra produção total dos analistas
*
* @route GET /urgenciaEmergencia/producaoTotal
* @returns {object} Producao
* @throws {error} Erro.
*/

    producaoTotal: async (req, res) => {
        try {

            const pedidos = await UrgenciasEmergencia.find({
                status: 'Concluído'
            })

            arrQuantidadeTotalMes = []

            pedidos.forEach(e => {
                // Se o retorno for 'Sem sucesso de contato', atribua o analista como 'cancelado'
                if (e.retorno === 'Sem sucesso de contato') {
                    e.analista = 'cancelado';
                }

                let index = arrQuantidadeTotalMes.findIndex(val => val.data == moment(e.dataConclusao).format('MM/YYYY'))

                if (index < 0) {
                    arrQuantidadeTotalMes.push({
                        data: moment(e.dataConclusao).format('MM/YYYY'),
                        quantidade: 1,
                        quantidadeAnalistaMes: [{
                            analista: e.analista,
                            quantidade: 1,
                            quantidadeAnalistaDia: [{
                                data: moment(e.dataConclusao).format('YYYY-MM-DD'),
                                quantidade: 1
                            }]
                        }]
                    })
                } else {
                    arrQuantidadeTotalMes[index].quantidade++
                }

                let indexAnalista = arrQuantidadeTotalMes[index]?.quantidadeAnalistaMes.findIndex(val => val.analista == e.analista)

                if (indexAnalista < 0) {
                    arrQuantidadeTotalMes[index].quantidadeAnalistaMes.push({
                        analista: e.analista,
                        quantidade: 1,
                        quantidadeAnalistaDia: [{
                            data: moment(e.dataConclusao).format('YYYY-MM-DD'),
                            quantidade: 1
                        }]
                    })
                } else {
                    if (arrQuantidadeTotalMes[index]?.quantidadeAnalistaMes === undefined) {
                        return
                    }
                    arrQuantidadeTotalMes[index].quantidadeAnalistaMes[indexAnalista].quantidade++
                }

                let indexDiaAnalista = arrQuantidadeTotalMes[index]?.quantidadeAnalistaMes[indexAnalista]?.quantidadeAnalistaDia.findIndex(val => val.data == moment(e.dataConclusao).format('YYYY-MM-DD'))

                if (indexDiaAnalista < 0) {
                    arrQuantidadeTotalMes[index].quantidadeAnalistaMes[indexAnalista].quantidadeAnalistaDia.push({
                        data: moment(e.dataConclusao).format('YYYY-MM-DD'),
                        quantidade: 1
                    })
                } else {
                    if (arrQuantidadeTotalMes[index].quantidadeAnalistaMes[indexAnalista] === undefined) {
                        return
                    }
                    arrQuantidadeTotalMes[index].quantidadeAnalistaMes[indexAnalista].quantidadeAnalistaDia[indexDiaAnalista].quantidade++
                }
            })

            return res.status(200).json({
                arrQuantidadeTotalMes
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },


    /**
* Salva tentativa de contato
*
* @route PUT /urgenciaEmergencia/salvarContato
* @returns {object} Proposta
* @throws {error} Erro.
*/

    salvarContato: async (req, res) => {
        try {

            const { obj, id } = req.body

            if (obj.contato === 'contato1') {
                const proposta = await UrgenciasEmergencia.findByIdAndUpdate({
                    _id: id
                }, {
                    contato1: moment(new Date()).format('YYYY-MM-DD HH:mm')
                })
            }

            if (obj.contato === 'contato2') {
                const proposta = await UrgenciasEmergencia.findByIdAndUpdate({
                    _id: id
                }, {
                    contato2: moment(new Date()).format('YYYY-MM-DD HH:mm')
                })
            }

            if (obj.contato === 'contato3') {
                const proposta = await UrgenciasEmergencia.findByIdAndUpdate({
                    _id: id
                }, {
                    contato3: moment(new Date()).format('YYYY-MM-DD HH:mm')
                })
            }

            return res.status(200).json({
                msg: 'Contato atualizado com sucesso!'
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

            const { page = 1, limit = 25, pesquisa } = req.query
            console.log(pesquisa);
            let skip = (page - 1) * limit

            const result = await UrgenciasEmergencia.find({
                $or: [
                    { nomeAssociado: { $regex: new RegExp(pesquisa, 'i') } },
                    { numAssociado: { $regex: pesquisa } },
                    { proposta: { $regex: pesquisa } },
                ]
            }).skip(skip).limit(limit)

            const total = await UrgenciasEmergencia.find({
                $or: [
                    { nomeAssociado: { $regex: new RegExp(pesquisa, 'i') } },
                    { numAssociado: { $regex: pesquisa } },
                    { proposta: { $regex: pesquisa } },
                ]
            }).countDocuments()

            console.log(result);
            console.log(total);

            return res.json({
                result,
                total
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    producaoMensal: async (req, res) => {
        try {

            const { mes, analista } = req.params

            const totalUe = await UrgenciasEmergencia.countDocuments({
                dataRecebimento: { $regex: mes }
            })

            const totalUeMesPassado = await UrgenciasEmergencia.countDocuments({
                dataRecebimento: { $regex: moment(mes).subtract(1, 'months').format('YYYY-MM') }
            })

            const totalUeConcluido = await UrgenciasEmergencia.countDocuments({
                dataRecebimento: { $regex: mes },
                status: 'Concluído'
            })

            const totalUeConcluidoMesPassado = await UrgenciasEmergencia.countDocuments({
                dataRecebimento: { $regex: moment(mes).subtract(1, 'months').format('MM/YYYY') },
                status: 'Concluído'
            })

            const totalUeAnalista = await UrgenciasEmergencia.countDocuments({
                dataConclusao: { $regex: mes },
                analista
            })

            const ues = await UrgenciasEmergencia.find({
                dataRecebimento: { $regex: mes },
            }).lean()

            let dates = []

            for (const item of ues) {
                if (!dates.includes(moment(item.dataRecebimento).format('YYYY-MM-DD'))) {
                    dates.push(moment(item.dataRecebimento).format('YYYY-MM-DD'))
                }
            }

            dates = dates.sort()

            let series = [
                {
                    name: analista,
                    data: []
                }
            ]

            for (const date of dates) {
                const count = ues.filter(e => moment(e.dataRecebimento).format('YYYY-MM-DD') === date && e.analista === analista).length
                series[0].data.push(count)
            }

            dates = dates.map(e => moment(e).format('DD/MM'))

            return res.status(200).json({
                totalUe,
                totalUeMesPassado,
                totalUeConcluido,
                totalUeConcluidoMesPassado,
                totalUeAnalista,
                dates,
                series
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