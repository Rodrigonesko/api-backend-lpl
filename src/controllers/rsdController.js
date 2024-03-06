const Pedido = require('../models/Rsd/Pedido')
const Pessoa = require('../models/Rsd/Pessoa')
const Pacote = require('../models/Rsd/Pacote')
const Operador = require('../models/Rsd/Operador')
const Clinica = require('../models/Rsd/Clinica')
const Gravacao = require('../models/Rsd/Gravacao')
const FormaPagamento = require('../models/Rsd/FormaPagamento')
const StatusFinalizacao = require('../models/Rsd/StatusFinalizacao')
const Agenda = require('../models/Rsd/Agenda')

const path = require('path')
const moment = require('moment')
const fs = require('fs')
const multer = require('multer')
const os = require('os')

const storageRSd = multer.diskStorage({
    destination: (req, file, cb) => {
        const name = file.originalname
        const dir = './uploads/rsd/baseRsd/'
        if (!fs.existsSync(dir)) {
            //Efetua a criação do diretório
            fs.mkdir(dir, (err) => {
                if (err) {
                    console.log("Deu ruim...");
                    return
                }
                console.log("Diretório criado!")
            }); h
        }

        cb(null, dir)
    },
    filename: (req, file, cb) => {
        const { name, ext } = path.parse(file.originalname)

        cb(null, `baseRsd`)
    }
})

const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const { pacote } = req.params
        const { name, ext } = path.parse(file.originalname)
        const dir = `./uploads/rsd/gravacoes/${pacote}/`
        if (!fs.existsSync(dir)) {
            //Efetua a criação do diretório
            fs.mkdir(dir, (err) => {
                if (err) {
                    console.log("Deu ruim...");
                    return
                }
                console.log("Diretório criado!")
            });
        }

        const usuario = req.user
        const arquivo = file.originalname

        let tipo = "Arquivo"

        if (ext === '.wav') {
            tipo = "Gravação"
        }

        await Gravacao.create({
            caminho: dir,
            usuario: usuario,
            arquivo: arquivo,
            tipo: tipo,
            pacote: pacote
        })

        console.log(usuario, arquivo, tipo);

        cb(null, dir)
    },
    filename: (req, file, cb) => {
        const { name, ext } = path.parse(file.originalname)

        cb(null, `${name}${ext}`)
    }
})

const storageAgd = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = './uploads/rsd/agds/'
        if (!fs.existsSync(dir)) {
            //Efetua a criação do diretório
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
        const { name, ext } = path.parse(file.originalname)

        cb(null, `agd.csv`)
    }
})

const xlsx = require('xlsx')

const uploadRsd = multer({ storage: storageRSd }).single('file')
const uploadPedidosAntigos = multer({ dest: os.tmpdir() }).single('file')
const uploadGravacao = multer({ storage }).single('file')
const uploadAgd = multer({ storage: storageAgd }).single('file')

module.exports = {
    upload: async (req, res) => {
        try {

            uploadRsd(req, res, async (err) => {

                const pedidosBanco = await Pedido.find()

                console.log('pedidos banco ok');

                let pedidos = []

                console.log(req.file.originalname);

                const valorCorte = req.body.corte

                console.log(valorCorte);

                if (req.file.originalname.indexOf('PF') !== -1) {

                    let file = fs.readFileSync(req.file.path, { encoding: 'latin1' })

                    let listaArr = file.split('\n')
                    let result = listaArr.map(e => {
                        return e.split(';')
                    })

                    console.log(`antes do filtro: ${result.length}`);

                    console.log('fila pf');

                    let mapCpfs = new Map()
                    let arrPedidos = []

                    let setResult = new Set()

                    result = result.filter((item) => {      //Filtra todos os pedidos duplicados
                        const pedidoDuplicado = setResult.has(item[0])
                        setResult.add(item[0])
                        return !pedidoDuplicado
                    })

                    console.log(`pós filtro: ${result.length}`);

                    for (const e of result) {
                        if (e[1] == 'Aguardando documentação' ||
                            e[1] == 'Documento recebido na Amil' ||
                            e[1] == 'Em processamento' ||
                            e[1] == 'Pedido Cadastrado' ||
                            e[1] == 'Aguardando documento original' ||
                            e[1] == 'Em Análise Técnica'
                        ) {

                            let rep = e[13].replace(' - ', '-')
                            let split = rep.split('-')
                            let mo = split[0]
                            let beneficiario = split[1]

                            //Alguns casos vem com &apos e é preciso fazer uma verificação e corrigir esses casos

                            if (beneficiario.indexOf('&apos') !== -1) {
                                beneficiario = `${beneficiario}${e[14]}`
                                e[14] = e[15]
                                e[15] = e['Tipo Envelope']
                                console.log(beneficiario, e[14], e[15]);
                            }

                            e[14] = brToAmerican(e[14])
                            e[15] = brToAmerican(e[15])

                            arrPedidos.push([
                                e[0],
                                e[1],
                                e[3],
                                e[4],
                                e[5],
                                e[6],
                                e[12],
                                mo,
                                beneficiario,
                                e[14],
                                e[15],
                                e[20],
                                'pf',
                                'RSD'
                            ])

                            if (mapCpfs.has(e[12])) {
                                mapCpfs.set(e[12], mapCpfs.get(e[12]) + e[14])
                            } else {
                                mapCpfs.set(e[12], e[14])
                            }
                        }
                    }

                    let arr = []

                    console.log('filtrando por valor');

                    console.log(`Numero de pedidos filtrado sem repetir e apenas com status que tratamos: ${arrPedidos.length}`);

                    //console.log(mapCpfs);

                    //Filtra os pedidos pelo valor de corte

                    for (const val of arrPedidos) {
                        for (const [cpf, value] of mapCpfs) {
                            if (value >= valorCorte) {
                                if (val[6] == cpf) {
                                    arr.push(val)
                                    break
                                }
                            }
                        }
                    }

                    console.log('verificando se existe na lpl');

                    console.log(arr.length);


                    for (const e of arr) {

                        const existeNaLpl = pedidosBanco.some(item => e[0] === item.numero);
                        if (!existeNaLpl) {
                            pedidos.push(e);
                        }

                    }

                    // arr.forEach(e => { //Verifica se existe na lpl
                    //     let flag = 0
                    //     pedidosBanco.forEach(item => {
                    //         if (e[0] == item.numero) {
                    //             flag++
                    //             return
                    //         }
                    //     })

                    //     if (flag == 0) {
                    //         pedidos.push(e)
                    //     }

                    // })

                    console.log(pedidos.length);

                } else {
                    console.log('fila pj');

                    let file = fs.readFileSync(req.file.path)

                    const workbook = xlsx.read(file, { type: 'array' })

                    const firstSheetName = workbook.SheetNames[0]

                    const worksheet = workbook.Sheets[firstSheetName]

                    let result = xlsx.utils.sheet_to_json(worksheet)

                    for (const e of result) {
                        let conc = `${e[' Valor Apresentado'].replace('R$ ', '').replace('.', '').replace(',', '.')}`
                        conc = +conc
                        conc = `${e['Número do Protocolo'].replace(/[^0-9]/g, '')}${conc}`
                        let flag = 0

                        pedidosBanco.forEach(item => {
                            let concBanco = `${item?.protocolo?.replace(/[^0-9]/g, '')}${Number(item.valorApresentado)}`
                            if (concBanco == conc) {
                                flag++
                                return
                            }
                        })

                        let mo
                        let beneficiario

                        if (!e[' Beneficiário']) {

                        } else {
                            let split = e[' Beneficiário']?.split(' ')
                            mo = split[1]
                            beneficiario = split[2]
                        }

                        console.log(mo, beneficiario);

                        if (flag == 0) {
                            pedidos.push([
                                undefined,
                                undefined,
                                e['Data Solicitação'],
                                undefined,
                                undefined,
                                e['Data Pagamento'],
                                undefined,
                                mo,
                                beneficiario,
                                e[' Valor Apresentado']?.replace('R$ ', '').replace('.', '').replace(',', '.'),
                                e[' Valor Reembolsado']?.replace('R$ ', '').replace('.', '').replace(',', '.'),
                                e['Número do Protocolo'].replace(/[^0-9]/g, ''),
                                e['Operadora Beneficiário'].replace(' ', ' '),
                                'RSD'
                            ])
                        }
                    }
                }

                const notorios = [
                    'OTAVIANO JOSE DA COSTA',
                    'EDSON VANDER DA COSTA BATISTA',
                    'ERICK JACQUIN',
                    'VERA REGINA OLIVEIRA GIMENEZ',
                    'WALTER CASAGRANDE JUNIOR',
                    'JOSE MARIA EYMAEL',
                    'RUBENS FURLAN',
                    'REINHOLD STEPHANES JUNIOR',
                    'FRANCISCO KSYVICKIS',
                    'FLORISVAL MEINAO',
                    'ALBA VITORIA DE MONCLAIR',
                    'MARIA IZILDINHA POSSI',
                    'ROLANDO BOLDRIN',
                    'MARCELLO ISMERIO DA SILVA',
                    'MARIA BETHANIA VIANNA TELLES VELLOSO',
                    'LUCIANO CALLEGARI',
                    'CLAUDINE MELO RODRIGUES',
                    'PETER PAUL LORENCO ESTERMANN',
                    'IVO BUCARESKY',
                    'SERGIO JUBRAN RACY',
                    'PAULO ROBERTO FRANCO MARINHO',
                    'CELENE ARAUJO OLIVEIRA',
                    'RAFAELA BELO FREIRE DE LIMA',
                    'MARIA ANDREA MIRANDA RODRIGUES PANTOJA DE CARVALHO',
                    'ROBERTO RAHMIEL BEN MEIR',
                    'DILSON SCHER NETO',
                    'MARCELO STEPHANES'
                ]

                pedidos = pedidos.filter(e => {

                    let flag = 0

                    notorios.forEach(notorio => {
                        if (e[8] === notorio) {
                            flag++
                        }
                    })

                    return flag === 0
                })

                return res.status(200).json({
                    pedidos
                })
            })
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    subir: async (req, res) => {
        try {

            const { pedidos } = req.body

            //Verifica se ja existe pessoa, e caso não existe insere no banco

            const addPessoas = await Promise.all(pedidos.map(async item => {
                return await Pessoa.findOneAndUpdate({
                    mo: item[7]
                }, {
                    cpf: item[6],
                    nome: item[8],
                    mo: item[7]
                }, {
                    upsert: true
                })
            }))

            console.log(pedidos);


            const addPedidos = await Promise.all(pedidos.map(async item => {
                let numero = item[0]
                let protocolo = item[11]
                let valorApresentado = item[9]
                let valorReembolsado = item[10]

                let dataSolicitacao = item[2]
                let dataPagamento = item[3]

                let dataSla = moment(new Date()).add(3, 'days').toDate()

                if (item[12] == 'pf') {
                    dataSla = moment(new Date()).toDate()

                    //Datas vem no padrão errado e precisam ser transformadas

                    dataSolicitacao = ajustarDataPadraoAmericano(dataSolicitacao)
                    dataPagamento = ajustarDataPadraoAmericano(dataPagamento)

                    item[12] = '19 - AMIL Ind (Célula PF)'

                } else {

                    dataSolicitacao = ExcelDateToJSDate(item[2])
                    dataSolicitacao.setDate(dataSolicitacao.getDate() + 1)
                    dataSolicitacao = moment(dataSolicitacao).format('YYYY-MM-DD')

                    dataPagamento = ExcelDateToJSDate(item[5])
                    dataPagamento.setDate(dataPagamento.getDate() + 1)
                    dataPagamento = moment(dataPagamento).format('YYYY-MM-DD')

                    const operadores = await Operador.find()
                    operadores.forEach(e => {

                        if (item[12].replace(/[^0-9]/g, '') == e.descricao.replace(/[^0-9]/g, '')) {
                            dataSla = moment(new Date()).add(e.sla, 'days').toDate()
                            return
                        }
                    })
                }

                let mo = item[7]
                let nome = item[8]

                return await Pedido.create({
                    numero: numero,
                    protocolo: protocolo,
                    valorApresentado: valorApresentado,
                    valorReembolsado: valorReembolsado,
                    dataSla: dataSla,
                    ativo: true,
                    status: 'A iniciar',
                    statusPacote: 'Não iniciado',
                    dataSolicitacao,
                    dataPagamento,
                    mo,
                    pessoa: nome,
                    fase: 'A iniciar',
                    statusGerencial: 'A iniciar',
                    statusPadraoAmil: 'A iniciar',
                    statusProtocolo: 'A iniciar',
                    operador: item[12],
                    fila: item[13]
                })

            }))

            return res.status(200).json({
                pedidos
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    uploadQuarentena: async (req, res) => {
        try {

            uploadRsd(req, res, async (err) => {

                const pedidosBanco = await Pedido.find({
                    fila: 'Alta Frequência Consulta'
                })

                let pedidos = []

                let file = fs.readFileSync(req.file.path)

                const workbook = xlsx.read(file, { type: 'array' })

                const firstSheetName = workbook.SheetNames[0]

                const worksheet = workbook.Sheets[firstSheetName]

                let result = xlsx.utils.sheet_to_json(worksheet)

                result.forEach((e, key) => {

                    let conc = `${e[' Valor Apresentado'].replace('R$ ', '').replace('.', '').replace(',', '.')}`
                    conc = +conc
                    conc = `${e['Número do Protocolo'].replace(/[^0-9]/g, '')}${conc}`
                    let flag = 0

                    pedidosBanco.forEach(item => {
                        let concBanco = `${item?.protocolo?.replace(/[^0-9]/g, '')}${Number(item.valorApresentado)}`
                        if (concBanco == conc) {
                            flag++
                            return
                        }
                    })

                    let mo
                    let beneficiario

                    if (!e[' Beneficiário']) {

                    } else {
                        let split = e[' Beneficiário']?.split(' ')
                        mo = split[1]
                        beneficiario = split[2]
                    }

                    if (flag == 0) {
                        pedidos.push([
                            undefined,
                            undefined,
                            e['Data Solicitação'],
                            undefined,
                            undefined,
                            e['Data Pagamento'],
                            undefined,
                            mo,
                            beneficiario,
                            e[' Valor Apresentado']?.replace('R$ ', '').replace('.', '').replace(',', '.'),
                            e[' Valor Reembolsado']?.replace('R$ ', '').replace('.', '').replace(',', '.'),
                            e['Número do Protocolo'].replace(/[^0-9]/g, ''),
                            e['Operadora Beneficiário'].replace(' ', ' '),
                            'Alta Frequência Consulta'
                        ])
                    }
                })

                const notorios = [
                    'OTAVIANO JOSE DA COSTA',
                    'EDSON VANDER DA COSTA BATISTA',
                    'ERICK JACQUIN',
                    'VERA REGINA OLIVEIRA GIMENEZ',
                    'WALTER CASAGRANDE JUNIOR',
                    'JOSE MARIA EYMAEL',
                    'RUBENS FURLAN',
                    'REINHOLD STEPHANES JUNIOR',
                    'FRANCISCO KSYVICKIS',
                    'FLORISVAL MEINAO',
                    'ALBA VITORIA DE MONCLAIR',
                    'MARIA IZILDINHA POSSI',
                    'ROLANDO BOLDRIN',
                    'MARCELLO ISMERIO DA SILVA',
                    'MARIA BETHANIA VIANNA TELLES VELLOSO',
                    'LUCIANO CALLEGARI',
                    'CLAUDINE MELO RODRIGUES',
                    'PETER PAUL LORENCO ESTERMANN',
                    'IVO BUCARESKY',
                    'SERGIO JUBRAN RACY',
                    'PAULO ROBERTO FRANCO MARINHO',
                    'CELENE ARAUJO OLIVEIRA',
                    'RAFAELA BELO FREIRE DE LIMA',
                    'MARIA ANDREA MIRANDA RODRIGUES PANTOJA DE CARVALHO',
                    'ROBERTO RAHMIEL BEN MEIR',
                    'DILSON SCHER NETO',
                    'MARCELO STEPHANES'
                ]

                pedidos = pedidos.filter(e => {

                    let flag = 0

                    notorios.forEach(notorio => {
                        if (e[8] === notorio) {
                            flag++
                        }
                    })

                    return flag === 0
                })

                return res.status(200).json({
                    pedidos
                })
            })
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    //Mostra todos os pedidos

    show: async (req, res) => {
        try {
            const pedidos = await Pedido.find()

            return res.status(200).json({
                pedidos
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    //Mostra pessoa a partir da MO

    mostrarPessoa: async (req, res) => {
        try {
            const { mo } = req.params

            const pessoa = await Pessoa.findOne({
                mo: mo
            })

            return res.status(200).json({
                pessoa
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    //Atualizar informações da pessoa

    atualizarInformacoes: async (req, res) => {
        try {

            const { dataNascimento, email, fone1, fone2, fone3, contratoEmpresa, mo, cpf } = req.body

            const pessoa = await Pessoa.findOneAndUpdate({
                mo: mo
            }, {
                dataNascimento,
                email,
                fone1,
                fone2,
                fone3,
                contratoEmpresa,
                cpf
            })

            const pedido = await Pedido.updateMany({
                mo: mo
            }, {
                contratoEmpresa
            })

            return res.status(200).json({
                pessoa
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    //Busca dados do pedido

    buscarPedido: async (req, res) => {
        try {
            const { pedido } = req.params

            const result = await Pedido.findById({
                _id: pedido
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

    // Busca clinica a partir do cnpj

    buscarClinica: async (req, res) => {
        try {

            const { cnpj } = req.body

            const clinica = await Clinica.findOne({
                cnpj
            })

            if (!clinica) {
                return res.status(501).json({
                    msg: 'Não foi encontrado clinica'
                })
            }

            return res.status(200).json({
                clinica
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    // Edita informações do pedido

    editarPedido: async (req, res) => {
        try {

            const { pedido, valorApresentado, valorReembolsado, cnpj, clinica, nf, pedidoEditado } = req.body

            const updatePedido = await Pedido.findByIdAndUpdate({
                _id: pedido
            }, {
                valorApresentado: valorApresentado,
                valorReembolsado: valorReembolsado,
                cnpj: cnpj,
                clinica: clinica,
                nf: nf,
                numero: pedidoEditado
            })

            const updateClinica = await Clinica.findOneAndUpdate({
                cnpj: cnpj
            }, {
                descricao: clinica
            }, {
                upsert: true
            })

            return res.status(200).json({
                updateClinica, updatePedido
            })


        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    // Busca pedido por protocolo

    buscarMoProtocolo: async (req, res) => {
        try {

            const { protocolo } = req.params

            const pedido = await Pedido.findOne({
                protocolo
            })

            return res.status(200).json({
                pedido
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    //Cria novo pedido

    criarPedido: async (req, res) => {
        try {

            const { pedido, protocolo, valorApresentado, valorReembolsado, cnpj, clinica, nf, mo, fila } = req.body

            const pessoa = await Pessoa.findOne({
                mo
            })

            const protocoloBanco = await Pedido.findOne({
                protocolo
            })

            const create = await Pedido.create({
                numero: pedido,
                protocolo,
                valorApresentado,
                valorReembolsado,
                cnpj,
                clinica,
                nf,
                ativo: true,
                status: 'A iniciar',
                statusPacote: 'Não iniciado',
                fase: 'A iniciar',
                statusGerencial: 'A iniciar',
                statusPadraoAmil: 'A iniciar',
                mo,
                pessoa: pessoa.nome,
                dataSla: protocoloBanco.dataSla,
                operador: protocoloBanco.operador,
                fila
            })

            const updateClinica = await Clinica.findOneAndUpdate({
                cnpj: cnpj
            }, {
                descricao: clinica
            }, {
                upsert: true
            })

            console.log(create, updateClinica);

            return res.status(200).json({
                create,
                updateClinica
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    // Cria novo protocolo

    criarProtocolo: async (req, res) => {
        try {
            const { protocolo, dataSolicitacao, dataPagamento, operadora, mo, pedido } = req.body

            const pessoa = await Pessoa.findOne({
                mo: mo
            })

            const operadores = await Operador.find()

            let sla = 3

            operadores.forEach(e => {
                if (e.descricao == operadora) {
                    sla = e.sla
                }
            })

            dataSla = moment(new Date()).add(sla, 'days').toDate()

            //Deve ser criado na tabela de pedido

            const criarProtocolo = await Pedido.create({
                numero: pedido,
                protocolo,
                dataSolicitacao,
                dataPagamento,
                ativo: true,
                pessoa: pessoa.nome,
                mo,
                status: 'A iniciar',
                statusPacote: 'Não iniciado',
                fase: 'A iniciar',
                statusGerencial: 'A iniciar',
                statusPadraoAmil: 'A iniciar',
                dataSla,
                operador: operadora
            })

            return res.status(200).json({
                criarProtocolo
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    // Cria pacote com varios pedidos dentro

    criarPacote: async (req, res) => {
        try {

            const { arrPedidos } = req.body

            if (arrPedidos.length === 0) {
                return res.status(500).json({
                    msg: 'Nenhum pedido selecionado!'
                })
            }

            const pacote = await Pacote.create({
                ativo: true,
                status: 'A iniciar'
            })

            const idPacote = pacote._id

            const updatePedidos = await Promise.all(arrPedidos.map(async item => {

                return await Pedido.findOneAndUpdate({
                    _id: item,
                    ativo: true
                }, {
                    pacote: idPacote,
                    status: 'Em andamento',
                    statusPacote: 'A iniciar',
                })
            }))

            return res.status(200).json({
                idPacote, updatePedidos
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    // Busca pedidos a partir da MO

    buscarPedidosMo: async (req, res) => {
        try {

            const { mo } = req.params

            const pedidos = await Pedido.find({
                mo: mo
            }).sort([['createdAt', -1]])

            return res.status(200).json({
                pedidos
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    // Assume o pacote

    assumirPacote: async (req, res) => {
        try {
            const { pacote } = req.body

            const name = req.user

            const pedidos = await Pedido.find({
                pacote: pacote
            })

            for (const item of pedidos) {
                const updatePedido = await Pedido.findByIdAndUpdate({
                    _id: item._id
                }, {
                    analista: name
                })
            }

            const updatePacote = await Pacote.findByIdAndUpdate({
                _id: pacote
            }, {
                analista: name
            })


            return res.status(200).json({
                msg: 'Assumido com sucesso!'
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    // Busca os pedidos a partir do pacote

    buscarPedidosPacote: async (req, res) => {
        try {

            const { pacote } = req.params

            const pedidos = await Pedido.find({
                pacote: pacote
            })

            return res.status(200).json({
                pedidos
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    // Anexa os arquivos 

    anexarGravacao: async (req, res) => {
        try {

            uploadGravacao(req, res, async (err) => {

                // console.log(res.file);
            })

            const { pacote } = req.params

            const caminho = `./uploads/rsd/gravacoes/${pacote}`
            const usuario = req.user

            const update = await Pedido.updateMany({
                pacote
            }, {
                quemAnexou: usuario
            })

            const comentario = await Agenda.create({
                idPacote: pacote,
                usuario: req.user,
                parecer: 'Anexo de ligação/arquivos'
            })

            return res.status(200).json({
                msg: 'Anexado com sucesso'
            })
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    // Busca os arquivos a partir do pacote

    buscarArquivos: async (req, res) => {
        try {

            const { pacote } = req.params

            const arquivos = await Gravacao.find({
                pacote: pacote
            })

            return res.status(200).json({
                arquivos
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    // Busca formas de pagamento

    buscarFormasPagamento: async (req, res) => {
        try {

            const formasPagamento = await FormaPagamento.find()

            return res.status(200).json({
                formasPagamento
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    // Busca Status de Finalizações

    buscarStatusFinalizacao: async (req, res) => {
        try {

            const statusFinalizacoes = await StatusFinalizacao.find()

            return res.status(200).json({
                statusFinalizacoes
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    // Atualiza o status do pedido

    atualizarPedido: async (req, res) => {
        try {

            const { pacote, sucesso, motivoContato, confirmacaoServico, finalizacao, justificativa, dataSelo, dataAgendamento } = req.body

            console.log(pacote, sucesso, motivoContato, confirmacaoServico, finalizacao, justificativa, dataSelo);

            const pacoteBanco = await Pedido.findOne({  //Busca os pedidos daquele pacote
                pacote: pacote
            })

            if (sucesso === 'Sim') {    //Se houve sucesso de contato atualiza o pedido

                await Pedido.updateMany({
                    pacote: pacote
                }, {
                    analista: req.user,
                    contato: sucesso
                })
            }

            if (sucesso === 'Sem Retorno de Contato') {     //Caso não conseguiram contato finaliza o pedido como sem sucesso de contato
                await Agenda.create({
                    idPacote: pacote,
                    usuario: req.user,
                    parecer: "Cancelando o pacote por falta de contato"
                })

                await Pedido.updateMany({
                    pacote: pacote
                }, {
                    status: 'Finalizado',
                    statusPacote: 'Finalizado',
                    fase: 'Finalizado',
                    statusGerencial: 'Protocolo Cancelado',
                    statusPadraoAmil: 'CANCELAMENTO - Sem retorno pós 5 dias úteis',
                    dataConclusao: moment().format('YYYY-MM-DD'),
                    analista: req.user,
                    contato: sucesso
                })
            }

    
            if (pacoteBanco.statusPacote === 'A iniciar' && sucesso === 'Não') {        //1° Tentativa de contato

                await Agenda.create({
                    idPacote: pacote,
                    usuario: req.user,
                    parecer: "Iniciado Processamento (etapa: 1° Tentativa)"
                })

                await Pedido.updateMany({
                    pacote: pacote
                }, {
                    statusPacote: '2° Tentativa',
                    analista: req.user,
                    contato: sucesso
                })
            }

            if (pacoteBanco.statusPacote === '2° Tentativa' && sucesso === 'Não') {     //2° Tentativa de contato

                await Agenda.create({
                    idPacote: pacote,
                    usuario: req.user,
                    parecer: "Iniciado Processamento (etapa: 2° Tentativa)"
                })

                await Pedido.updateMany({
                    pacote: pacote
                }, {
                    statusPacote: '3° Tentativa',
                    analista: req.user,
                    contato: sucesso
                })
            }

            if (pacoteBanco.statusPacote === '3° Tentativa' && sucesso === 'Não') {     //3° Tentativa de contato

                await Agenda.create({
                    idPacote: pacote,
                    usuario: req.user,
                    parecer: "Iniciado Processamento (etapa: 3° Tentativa)"
                })

                await Pedido.updateMany({
                    pacote: pacote
                }, {
                    statusPacote: 'Aguardando Retorno Contato',
                    status: 'Aguardando Retorno Contato',
                    fase: 'Em andamento',
                    statusGerencial: 'Aguardando Retorno Contato',
                    statusPadraoAmil: 'E-MAIL - Sem sucesso de contrato pós 3 tentativas, solicitado retorno',
                    analista: req.user,
                    contato: sucesso
                })
            }

            if (pacoteBanco.statusPacote === 'A iniciar' && sucesso === 'Sim') {    //Caso houve sucesso de contato

                await Agenda.create({
                    idPacote: pacote,
                    usuario: req.user,
                    parecer: "Iniciado Processamento (etapa: 1° Tentativa)"
                })

                await Pedido.updateMany({
                    pacote: pacote
                }, {
                    analista: req.user,
                    contato: sucesso
                })

            }

            if (pacoteBanco.statusPacote === '2° Tentativa' && sucesso === 'Sim') {

                await Agenda.create({
                    idPacote: pacote,
                    usuario: req.user,
                    parecer: "Iniciado Processamento (etapa: 2° Tentativa)"
                })

                await Pedido.updateMany({
                    pacote: pacote
                }, {
                    analista: req.user,
                    contato: sucesso
                })

            }

            if (pacoteBanco.statusPacote === '3° Tentativa' && sucesso === 'Sim') {

                await Agenda.create({
                    idPacote: pacote,
                    usuario: req.user,
                    parecer: "Iniciado Processamento (etapa: 3° Tentativa)"
                })

                await Pedido.updateMany({
                    pacote: pacote
                }, {
                    analista: req.user,
                    contato: sucesso
                })

            }

            if (pacoteBanco.statusPacote === '3° Tentativa' && sucesso === 'Sim') {

                await Agenda.create({
                    idPacote: pacote,
                    usuario: req.user,
                    parecer: "Iniciado Processamento (etapa: Aguardando Retorno Contato)"
                })

                await Pedido.updateMany({
                    pacote: pacote
                }, {
                    analista: req.user,
                    contato: sucesso
                })

            }

            console.log(`Data Agendamento: ${dataAgendamento}`);

            if(sucesso === 'Necessário Agendar Horario') {
                await Pedido.updateMany({
                    pacote: pacote
                }, {
                    dataAgendamento,
                    contato: sucesso
                })
            }

            if (sucesso === 'Não foi entrado em contato') {     //Caso não entre em contato e coloca a justificativa
                await Pedido.updateMany({
                    pacote: pacote
                }, {
                    justificativa,
                    contato: sucesso
                })
            }

            if (dataSelo) {         //Data em que foi ligado
                await Pedido.updateMany({
                    pacote: pacote
                }, {
                    dataSelo
                })
            }

            for (const item of motivoContato) {     //Loop responsável que passa por todos os pedidos do pacote

                let reconhece = false

                if (item[1] == 'Sim') {         //Caso o beneficiário reconheça o pedido reconhece recebe true
                    reconhece = true
                }

                if (reconhece === false) {      //Caso o beneficiário não reconheça o pedido finaliza o pedido como o beneficiario não reconhece o pedido

                    const updatePedido = await Pedido.findOneAndUpdate({
                        _id: item[0]
                    }, {
                        reconhece: reconhece,
                        status: 'Finalizado',
                        fase: 'Finalizado',
                        statusGerencial: 'Protocolo Cancelado',
                        statusPadraoAmil: 'CANCELAMENTO - Não reconhece Procedimento/Consulta',
                        dataConclusao: moment().format('YYYY-MM-DD'),
                        analista: req.user
                    })

                    await Agenda.create({
                        idPacote: pacote,
                        usuario: req.user,
                        parecer: `Beneficiário não reconhece pedido: ${item[0]}, finalizando pedido`
                    })

                } else {
                    const updatePedido = await Pedido.findOneAndUpdate({       //Atualiza como o beneficiario reconhece o pedido
                        _id: item[0]
                    }, {
                        reconhece: reconhece,
                        analista: req.user
                    })

                    await Agenda.create({
                        idPacote: pacote,
                        usuario: req.user,
                        parecer: `Beneficiário reconhece pedido: ${item[0]}`
                    })
                }

            }

            for (const item of confirmacaoServico) {        //Loop que passa por todos os pedidos do pacote

                if (item[1] === 'Pagamento não realizado') {    // Caso pagamento não realizado, finaliza pedido como pagamento nao realizado

                    const updatePedido = await Pedido.findOneAndUpdate({
                        _id: item[0]
                    }, {
                        formaPagamento: item[1],
                        status: 'Pagamento Não Realizado',
                        statusPacote: 'Finalizado',
                        fase: 'Finalizado',
                        statusGerencial: 'Pagamento Não Realizado',
                        statusPadraoAmil: 'INDEFERIR - Em contato beneficiário confirma que não realizou pagamento',
                        dataConclusao: moment().format('YYYY-MM-DD'),
                        analista: req.user
                    })

                    await Agenda.create({
                        idPacote: pacote,
                        usuario: req.user,
                        parecer: `Pedido: ${item[0]}, pagamento não realizado`
                    })

                } else {
                    const updatePedido = await Pedido.findOneAndUpdate({
                        _id: item[0]
                    }, {
                        formaPagamento: item[1],
                        status: 'Aguardando Docs',
                        fase: 'Em Andamento',
                        statusGerencial: 'Aguardando Comprovante',
                        statusPadraoAmil: 'AGD - Em ligação beneficiaria afirma ter pago, solicitando comprovante',
                        analista: req.user,
                        statusProtocolo: 'Em andamento'
                    })

                    if (item[1] === 'Dinheiro') {
                        const updatePedido = await Pedido.findOneAndUpdate({
                            _id: item[0]
                        }, {
                            formaPagamento: item[1],
                            status: 'Aguardando Docs',
                            fase: 'Em Andamento',
                            statusGerencial: 'Aguardando Comprovante',
                            statusPadraoAmil: 'AGD - Em ligação beneficiaria afirma ter pago em dinheiro, solicitando declaração de quitação',
                            analista: req.user,
                            statusProtocolo: 'Em andamento'
                        })
                    }

                    await Pacote.findByIdAndUpdate({
                        _id: pacote
                    }, {
                        status: 'Em andamento',
                    })

                    await Pedido.updateMany({
                        pacote: pacote
                    }, {
                        statusPacote: 'Em andamento',
                    })

                    await Agenda.create({
                        idPacote: pacote,
                        usuario: req.user,
                        parecer: `Pedido: ${item[0]}, Forma de Pagamento: ${item[1]}, Aguardando Comprovante`
                    })
                }

            }

            for (const item of finalizacao) {   //Loop responsavel por finalizar pedidos

                if (item[1] === 'Comprovante Correto') {
                    const updatePedido = await Pedido.findOneAndUpdate({
                        _id: item[0]
                    }, {
                        statusFinalizacao: 'Finalizado',
                        status: 'Finalizado',
                        fase: 'Finalizado',
                        statusGerencial: 'Comprovante Correto',
                        statusPadraoAmil: 'PAGAMENTO LIBERADO',
                        dataConclusao: moment().format('YYYY-MM-DD'),
                        analista: req.user
                    })
                }

                if (item[1] === 'Pago pela Amil sem Comprovante') {
                    const updatePedido = await Pedido.findOneAndUpdate({
                        _id: item[0]
                    }, {
                        statusFinalizacao: 'Finalizado',
                        status: 'Finalizado',
                        fase: 'Finalizado',
                        statusGerencial: 'Pago pela Amil sem Comprovante',
                        statusPadraoAmil: 'PAGAMENTO LIBERADO',
                        dataConclusao: moment().format('YYYY-MM-DD'),
                        analista: req.user
                    })
                }

                if (item[1] === 'Pagamento Não Realizado') {
                    const updatePedido = await Pedido.findOneAndUpdate({
                        _id: item[0]
                    }, {
                        statusFinalizacao: 'Finalizado',
                        status: 'Finalizado',
                        fase: 'Finalizado',
                        statusGerencial: 'Pagamento Não Realizado',
                        statusPadraoAmil: 'INDEFERIR - Em contato beneficiário confirma que não realizou pagamento',
                        dataConclusao: moment().format('YYYY-MM-DD'),
                        analista: req.user
                    })
                }

                if (item[1] === 'Comprovante Não Recebido') {
                    const updatePedido = await Pedido.findOneAndUpdate({
                        _id: item[0]
                    }, {
                        statusFinalizacao: 'Finalizado',
                        status: 'Finalizado',
                        fase: 'Finalizado',
                        statusGerencial: 'Protocolo Cancelado',
                        statusPadraoAmil: 'CANCELAMENTO - Comprovante não Recebido',
                        dataConclusao: moment().format('YYYY-MM-DD'),
                        analista: req.user
                    })
                }

                if (item[1] === 'Reapresentação de Protocolo Indeferido') {
                    const updatePedido = await Pedido.findOneAndUpdate({
                        _id: item[0]
                    }, {
                        statusFinalizacao: 'Finalizado',
                        status: 'Finalizado',
                        fase: 'Finalizado',
                        statusGerencial: 'Protocolo Cancelado',
                        statusPadraoAmil: 'INDEFERIR - Reapresentação de Protocolo Indeferido',
                        dataConclusao: moment().format('YYYY-MM-DD'),
                        analista: req.user
                    })
                }

                if (item[1] === 'Fracionamento de Nota Fiscal') {
                    await Pedido.updateOne({
                        _id: item[0]
                    }, {
                        statusFinalizacao: 'Finalizado',
                        status: 'Finalizado',
                        fase: 'Finalizado',
                        statusGerencial: 'Fracionamento de NF',
                        statusPadraoAmil: 'INDEFERIR - Em contato beneficiário foi confirmado fracionamento de Nota Fiscal',
                        dataConclusao: moment().format('YYYY-MM-DD'),
                        analista: req.user
                    })
                }

                await Agenda.create({
                    idPacote: pacote,
                    usuario: req.user,
                    parecer: `Pedido: ${item[0]}, finalização: ${item[1]}`
                })
            }

            const buscarPedidos = await Pedido.find({
                pacote: pacote
            })

            let flag = 0

            for (const item of buscarPedidos) {

                if (item.fase === 'Finalizado') {
                    flag++
                }

                if (buscarPedidos.length === flag) {
                    await Pedido.updateMany({
                        pacote: pacote
                    }, {
                        statusPacote: 'Finalizado'
                    })
                }
            }

            let protocolos = []

            for (const item of buscarPedidos) {

                const aux = await Pedido.findById({
                    _id: item._id
                })

                if (protocolos.indexOf(aux.protocolo) === -1) {
                    protocolos.push(aux.protocolo)
                }

            }

            for (const protocolo of protocolos) {
                const aux = await Pedido.find({
                    protocolo: protocolo
                })
                let flagPro = 0
                for (const obj of aux) {
                    if (obj.fase === 'Finalizado') {
                        flagPro++
                    }
                    if (aux.length === flagPro) {
                        await Pedido.updateMany({
                            protocolo: obj.protocolo
                        }, {
                            statusProtocolo: 'Finalizado'
                        })
                    }
                }
            }

            return res.status(200).json({
                msg: 'ok'
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    buscarAgenda: async (req, res) => {
        try {

            const { pacote } = req.params

            const agenda = await Agenda.find({
                idPacote: pacote
            })

            return res.status(200).json({
                agenda
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    buscarPedidosNaoFinalizados: async (req, res) => {
        try {

            const pedidos = await Pedido.find({
                status: {
                    $in: ['A iniciar', 'Em andamento', 'Aguardando Retorno Contato', 'Aguardando Docs']
                }
            })

            return res.status(200).json({
                pedidos
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    filtroPedidosNaoFinalizados: async (req, res) => {
        try {

            const { pesquisa, analista } = req.query

            console.log(pesquisa, analista);

            let filter = {}

            if (analista !== '') {
                filter = {
                    analista: {$regex: analista},
                }
            }

            const pessoa = await Pessoa.findOne({
                cpf: pesquisa
            })

            if (pessoa && pesquisa !== '' && analista === '') {
                const pedidos = await Pedido.find({
                    mo: pessoa.mo,
                    status: {
                        $in: ['A iniciar', 'Em andamento', 'Aguardando Retorno Contato', 'Aguardando Docs']
                    },
                    ...filter
                })
                return res.status(200).json({
                    pedidos
                })
            }

            const pedidos = await Pedido.find({
                $or: [
                    {
                        mo: pesquisa,
                        status: {
                            $in: ['A iniciar', 'Em andamento', 'Aguardando Retorno Contato', 'Aguardando Docs']
                        }
                    },
                    {
                        pessoa: { $regex: pesquisa },
                        status: {
                            $in: ['A iniciar', 'Em andamento', 'Aguardando Retorno Contato', 'Aguardando Docs']
                        }
                    },
                    {
                        protocolo: { $regex: pesquisa },
                        status: {
                            $in: ['A iniciar', 'Em andamento', 'Aguardando Retorno Contato', 'Aguardando Docs']
                        }
                    },
                    {
                        numero: pesquisa,
                        status: {
                            $in: ['A iniciar', 'Em andamento', 'Aguardando Retorno Contato', 'Aguardando Docs']
                        }
                    }
                ],
                ...filter
            })

            return res.status(200).json({
                pedidos
            })


        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    buscarOperadoras: async (req, res) => {
        try {

            const operadoras = await Operador.find()

            return res.status(200).json({
                operadoras
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    criarPedidoIndividual: async (req, res) => {
        try {

            const {
                mo,
                nome,
                dataNascimento,
                email,
                fone1,
                fone2,
                fone3,
                cpf,
                operadoraBeneficiario,
                protocolo,
                dataSolicitacao,
                dataPagamento,
                pedido,
                fila
            } = req.body

            const operadores = await Operador.find()

            let sla = 3

            operadores.forEach(e => {
                if (e.descricao == operadoraBeneficiario) {
                    sla = e.sla
                }
            })

            dataSla = moment(new Date()).add(sla, 'days').toDate()

            const pessoa = await Pessoa.findOneAndUpdate({
                mo: mo
            }, {
                nome,
                dataNascimento,
                email,
                fone1,
                fone2,
                fone3,
                ativo: true,
                cpf
            }, {
                upsert: true
            })

            const novoPedido = await Pedido.create({
                mo: mo,
                pessoa: nome,
                protocolo,
                operador: operadoraBeneficiario,
                dataSolicitacao,
                dataPagamento,
                numero: pedido,
                ativo: true,
                status: 'A iniciar',
                statusPacote: 'Não iniciado',
                dataSla,
                fase: 'A iniciar',
                statusGerencial: 'A iniciar',
                statusPadraoAmil: 'A iniciar',
                fila
            })

            return res.status(200).json({
                novoPedido
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    criarOperadora: async (req, res) => {
        try {

            const { descricao, sla } = req.body

            const operadora = await Operador.create({
                descricao,
                sla
            })

            return res.status(200).json({
                operadora
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    editarOperadora: async (req, res) => {
        try {
            const { descricao, sla, id } = req.body

            const operadora = await Operador.findByIdAndUpdate({
                _id: id
            }, {
                descricao,
                sla
            })

            return res.status(200).json({
                operadora
            })
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    buscarOperadora: async (req, res) => {
        try {

            const { id } = req.params

            const operadora = await Operador.findById({
                _id: id
            })

            return res.status(200).json({
                operadora
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    buscarPedidosFinalizados: async (req, res) => {
        try {

            const { pesquisa } = req.params

            const pedidos = await Pedido.find({
                $or: [
                    {
                        mo: pesquisa,
                        fase: 'Finalizado'
                    },
                    {
                        numero: pesquisa,
                        fase: 'Finalizado'
                    },
                    {
                        protocolo: pesquisa,
                        fase: 'Finalizado'
                    }
                ]
            })

            return res.status(200).json({
                pedidos
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    devolverAmil: async (req, res) => {
        try {

            const { id, motivoInativo } = req.body;

            console.log(id, motivoInativo);

            // Atualizar o pedido com as informações fornecidas
            const update = await Pedido.findOneAndUpdate(
                { _id: id },
                {
                    status: 'Finalizado',
                    fase: 'Finalizado',
                    statusGerencial: 'Devolvido Amil',
                    statusPadraoAmil: 'Devolvido Amil',
                    motivoInativo,
                    ativo: false,
                    analista: req.user,
                }
            );

            // Encontrar todos os pedidos com o mesmo pacote do pedido atual
            const buscaPorPacote = await Pedido.find({ pacote: update.pacote });

            // Verificar se todos os pedidos do pacote estão finalizados
            const isPacoteFinalizado = buscaPorPacote.every(item => item.fase === 'Finalizado');

            if (isPacoteFinalizado) {
                // Atualizar o statusPacote para 'Finalizado' de todos os pedidos no pacote
                await Pedido.updateMany({ pacote: update.pacote }, { statusPacote: 'Finalizado' });
            }

            // Encontrar todos os protocolos relacionados aos pedidos do pacote
            const protocolos = buscaPorPacote.map(item => item.protocolo);

            for (const protocolo of protocolos) {
                // Encontrar todos os pedidos com o mesmo protocolo
                const pedidosDoProtocolo = await Pedido.find({ protocolo: protocolo });

                // Verificar se todos os pedidos do protocolo estão finalizados
                const isProtocoloFinalizado = pedidosDoProtocolo.every(obj => obj.fase === 'Finalizado');

                if (isProtocoloFinalizado) {
                    // Atualizar o statusProtocolo para 'Finalizado' de todos os pedidos com o mesmo protocolo
                    await Pedido.updateMany({ protocolo: protocolo }, { statusProtocolo: 'Finalizado' });
                }
            }


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

    escrevarAgenda: async (req, res) => {
        try {

            const { pacote, parecer } = req.body

            const comentario = await Agenda.create({
                idPacote: pacote,
                usuario: req.user,
                parecer
            })

            return res.status(200).json({
                comentario
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    // Volta o pacote e todos os pedidos dentro dele para a fase Aguardando Docs

    voltarFase: async (req, res) => {
        try {
            const { pacote } = req.body

            const atualizar = await Pedido.updateMany({
                pacote: pacote
            }, {
                status: 'Aguardando Docs',
                fase: 'Em andamento',
                statusGerencial: 'Aguardando Comprovante',
                statusPadraoAmil: 'AGD - Em ligação beneficiaria afirma ter pago, solicitando comprovante',
                statusPacote: 'Aguardando Docs',
                statusProtocolo: 'Em andamento',
                ativo: true
            })

            console.log(pacote);

            return res.status(200).json({
                atualizar
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    // Volta fase de um unico pedido

    voltarFasePedido: async (req, res) => {
        try {
            const { pedido } = req.body

            const pacote = await Pedido.findOne({
                numero: pedido
            })

            const atualizarPacote = await Pedido.updateMany({
                pacote: pacote.pacote
            }, {
                statusPacote: 'Aguardando Docs'
            })

            const atualizar = await Pedido.findOneAndUpdate({
                numero: pedido
            }, {
                status: 'Aguardando Docs',
                fase: 'Em andamento',
                statusGerencial: 'Aguardando Comprovante',
                statusPadraoAmil: 'AGD - Em ligação beneficiaria afirma ter pago, solicitando comprovante',
                statusPacote: 'Aguardando Docs',
                statusPacote: 'Em andamento',
                ativo: true
            })

            await Pedido.updateMany({
                protocolo: atualizar.protocolo
            }, {
                statusProtocolo: 'Em andamento'
            })

            console.log(pedido);

            return res.status(200).json({
                atualizar
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },



    adicionarPrioridadeDossie: async (req, res) => {
        try {

            const { pedido, prioridade } = req.body

            console.log(pedido, !prioridade);

            const update = await Pedido.findOneAndUpdate({
                numero: pedido
            }, {
                prioridadeDossie: prioridade
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

    prioridadeDossiePacote: async (req, res) => {
        try {

            const { pacote, prioridade } = req.body

            const update = await Pedido.updateMany({
                pacote
            }, {
                prioridadeDossie: prioridade
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

    devolverPacote: async (req, res) => {
        try {

            const { pacote, motivoInativo } = req.body

            const result = await Pedido.updateMany({
                pacote: pacote
            }, {
                status: 'Finalizado',
                fase: 'Finalizado',
                statusGerencial: 'Devolvido Amil',
                statusPadraoAmil: 'Devolvido Amil',
                statusPacote: 'Finalizado',
                statusProtocolo: 'Finalizado',
                ativo: false,
                motivoInativo,
                analista: req.user
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

    devolverProtocolo: async (req, res) => {
        try {

            const { protocolo, pacote, motivoInativo } = req.body

            console.log(protocolo, pacote);

            const result = await Pedido.updateMany({
                protocolo,
                pacote
            }, {
                status: 'Finalizado',
                fase: 'Finalizado',
                statusGerencial: 'Devolvido Amil',
                statusPadraoAmil: 'Devolvido Amil',
                statusProtocolo: 'Finalizado',
                ativo: false,
                motivoInativo,
                analista: req.user
            })

            console.log(result);

            const buscaPorPacote = await Pedido.find({
                pacote
            });

            let flag = 0

            for (const item of buscaPorPacote) {
                if (item.fase === 'Finalizado') {
                    flag++
                }

                if (buscaPorPacote.length === flag) {
                    await Pedido.updateMany({
                        pacote
                    }, {
                        statusPacote: 'Finalizado'
                    })
                }
            }

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

    // Geração de relatório

    relatorioAmil: async (req, res) => {
        try {

            let { aPartir, ate } = req.params

            console.log(aPartir, ate);

            const result = await Pedido.find()

            let pedidos

            pedidos = result.filter(e => {
                return moment(e.createdAt).format('YYYY-MM-DD') >= aPartir && moment(e.createdAt).format('YYYY-MM-DD') <= ate
            })

            return res.status(200).json({
                pedidos
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    download: async (req, res) => {
        try {

            const { idPacote, filename } = req.params

            res.download(`./uploads/rsd/gravacoes/${idPacote}/${filename}`)
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    producaoDiaria: async (req, res) => {
        try {

            const { data } = req.params

            const pedidos = await Pedido.find({
                dataConclusao: data
            })

            let analistas = []

            pedidos.forEach(e => {
                if (!analistas.includes(e.analista)) {
                    analistas.push(e.analista)
                }
            })

            let producao = []

            for (const analista of analistas) {
                const count = await Pedido.find({
                    analista,
                    dataConclusao: data
                }).count()

                producao.push({
                    analista,
                    quantidade: count
                })
            }

            const total = await Pedido.find({
                dataConclusao: data
            }).count()

            return res.json({
                producao,
                total
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    adicionarFormaPagamento: async (req, res) => {
        try {

            const { formaPagamento } = req.body

            await FormaPagamento.create({
                nome: formaPagamento
            })

            return res.json({
                msg: 'ok'
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    deleteFormaPagamento: async (req, res) => {
        try {

            const { id } = req.params

            await FormaPagamento.deleteOne({
                _id: id
            })

            return res.json({
                msg: 'ok'
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    adicionarStatusFinalizacao: async (req, res) => {
        try {

            const { finalizacao } = req.body

            await StatusFinalizacao.create({
                descricao: finalizacao
            })

            return res.json({
                msg: 'ok'
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    deleteStatusFinalizacao: async (req, res) => {
        try {

            const { id } = req.params

            await StatusFinalizacao.deleteOne({
                _id: id
            })

            return res.json({
                msg: 'ok'
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },


    baixaAgd: async (req, res) => {
        try {

            uploadAgd(req, res, async (err) => {

                let file = fs.readFileSync(req.file.path)

                const workbook = xlsx.read(file, { type: 'array' })

                const firstSheetName = workbook.SheetNames[0]

                const worksheet = workbook.Sheets[firstSheetName]

                let result = xlsx.utils.sheet_to_json(worksheet)

                for (const e of result) {
                    if (e.procv === 'Confirmação de pagamento' || e.procv === 'Interface financeiro') {

                        await Pedido.updateOne({
                            _id: e.ID
                        }, {
                            statusPadraoAmil: 'PAGAMENTO LIBERADO',
                            statusGerencial: 'Comprovante correto',
                            fase: 'Finalizado',
                            dataConclusao: moment().format('YYYY-MM-DD'),
                            status: 'Finalizado'
                        })

                    }

                    if (e.procv === 'Pedido cancelado' && (e['Status Amil'] === 'AGD - Em ligação beneficiaria afirma ter pago, solicitando comprovante' || e['Status Amil'] === 'AGD - Em ligação beneficiaria afirma ter pago em dinheiro, solicitando declaração de quitação')) {

                        await Pedido.updateOne({
                            _id: e.ID
                        }, {
                            statusPadraoAmil: 'CANCELAMENTO - Comprovante não Recebido',
                            statusGerencial: 'Protocolo Cancelado',
                            fase: 'Finalizado',
                            dataConclusao: moment().format('YYYY-MM-DD'),
                            status: 'Finalizado'
                        })

                    }

                    if (e.procv === 'Pedido cancelado' && e['Status Amil'] === 'E-MAIL - Sem sucesso de contrato pós 3 tentativas, solicitado retorno') {

                        await Pedido.updateOne({
                            _id: e.ID
                        }, {
                            statusPadraoAmil: 'CANCELAMENTO - Sem retorno pós 5 dias úteis',
                            statusGerencial: 'Protocolo Cancelado',
                            fase: 'Finalizado',
                            dataConclusao: moment().format('YYYY-MM-DD'),
                            status: 'Finalizado'
                        })
                    }

                    const pedidos = await Pedido.find({
                        pacote: e['Código']
                    })

                    const protocolos = await Pedido.find({
                        protocolo: e['Número Protocolo'].replace(/\D/g, '')
                    })

                    let finalizadas = 0

                    let protocolosFinalizados = 0

                    pedidos.forEach(pedido => {
                        if (pedido.fase === 'Finalizado') {
                            finalizadas++
                        }
                    })

                    protocolos.forEach(pedido => {
                        if (pedido.fase === 'Finalizado') {
                            protocolosFinalizados++
                        }
                    })

                    if (finalizadas === pedidos.length) {

                        console.log(e['Código']);

                        await Pedido.updateMany({
                            pacote: e['Código']
                        }, {
                            statusPacote: 'Finalizado'
                        })
                    }

                    if (protocolosFinalizados === protocolos.length) {
                        await Pedido.updateMany({
                            protocolo: e['Número Protocolo'].replace(/\D/g, '')
                        }, {
                            statusProtocolo: 'Finalizado'
                        })
                    }
                }

                return res.json({
                    msg: 'ola'
                })

            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    teste: async (req, res) => {
        try {

            const ids = [
                '647f16486de1909bf2295c34',
                '647f16486de1909bf2295c36',
                '647f16486de1909bf2295c3a',
                '647f16486de1909bf2295c3e',
                '647f16486de1909bf2295c42',
                '6483098abacb97fd85f8dfdf',
                '648af4eb0e8182367147f031',
                '648af4eb0e8182367147f033',
                '648af4eb0e8182367147f035',
                '648af4eb0e8182367147f037',
                '648af4eb0e8182367147f039',
                '648af4eb0e8182367147f03b',
                '64905d4d92332b66396d72f3',
                '6492df4f41642d5e54cde944',
                '64943026b0abc3b66db49b17',
                '64948bb9a3a8e170d341a418',
            ]

            for (const id of ids) {

                await Pedido.updateOne({
                    _id: id
                }, {
                    statusGerencial: 'Fracionamento de NF',
                    statusPadraoAmil: 'INDEFERIR - Em contato beneficiário foi confirmado fracionamento de Nota Fiscal',
                    formaPagamento: 'Fracionamento de NF'
                })

            }

            return res.json({ ids })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    relatorioProducao: async (req, res) => {
        try {

            const pedidos = await Pedido.find()

            let arrProd = {}

            for (const pedido of pedidos) {

                if (pedido.dataConclusao) {
                    const dataConclusao = moment(pedido.dataConclusao).format('DD/MM/YYYY')

                    const key = `${pedido.analista}-${dataConclusao}`

                    if (arrProd[key]) {
                        arrProd[key].quantidade += 1
                    } else {
                        arrProd[key] = {
                            analista: pedido.analista,
                            data: dataConclusao,
                            quantidade: 1,
                            indeferidos: 0,
                            cancelados: 0
                        }
                    }

                    if (pedido.statusPadraoAmil === 'INDEFERIR - Em contato beneficiário confirma que não realizou pagamento') {
                        arrProd[key].indeferidos += 1
                    }

                    if (pedido.statusGerencial === 'Protocolo Cancelado') {
                        arrProd[key].cancelados += 1
                    }

                }
            }

            console.log(arrProd);

            return res.json(arrProd)

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    producaoMensal: async (req, res) => {
        try {

            const { mes, analista } = req.params

            const findMelhor = await Pedido.find({
                dataConclusao: { $regex: mes }
            })

            const analistasContagem = {}

            for (const pedido of findMelhor) {
                const analista = pedido.analista
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
            }

            const find = await Pedido.find({
                dataConclusao: { $regex: mes },
                analista
            })

            const objPrazo = {}
            let arrPrazo = [['Data', 'd0', 'd1', 'd2', 'd3', 'd4+', 'meta']]
            let indeferidos = 0
            let naoIndeferidos = 0
            let cancelado = 0
            let naoCancelado = 0
            let total = 0

            for (const item of find) {

                total++

                const key = moment(item.dataConclusao).format('DD/MM/YYYY')

                const diasUteis = calcularDiasUteis(moment(item.createdAt), moment(item.dataConclusao), feriados)

                if (item.statusPadraoAmil === 'INDEFERIR - Em contato beneficiário confirma que não realizou pagamento') {
                    indeferidos++
                } else {
                    naoIndeferidos++
                }

                if (item.statusGerencial === 'Protocolo Cancelado') {
                    cancelado++
                } else {
                    naoCancelado++
                }

                if (diasUteis === 0) {
                    if (objPrazo[key]) {
                        objPrazo[key].d0 += 1
                    } else {
                        objPrazo[key] = {
                            d0: 1,
                            d1: 0,
                            d2: 0,
                            d3: 0,
                            d4: 0
                        }
                    }
                }

                if (diasUteis === 1) {
                    if (objPrazo[key]) {
                        objPrazo[key].d1 += 1
                    } else {
                        objPrazo[key] = {
                            d0: 0,
                            d1: 1,
                            d2: 0,
                            d3: 0,
                            d4: 0
                        }
                    }
                }

                if (diasUteis === 2) {
                    if (objPrazo[key]) {
                        objPrazo[key].d2 += 1
                    } else {
                        objPrazo[key] = {
                            d0: 0,
                            d1: 0,
                            d2: 1,
                            d3: 0,
                            d4: 0
                        }
                    }
                }

                if (diasUteis === 3) {
                    if (objPrazo[key]) {
                        objPrazo[key].d3 += 1
                    } else {
                        objPrazo[key] = {
                            d0: 0,
                            d1: 0,
                            d2: 0,
                            d3: 1,
                            d4: 0
                        }
                    }
                }

                if (diasUteis >= 4) {
                    if (objPrazo[key]) {
                        objPrazo[key].d4 += 1
                    } else {
                        objPrazo[key] = {
                            d0: 0,
                            d1: 0,
                            d2: 0,
                            d3: 0,
                            d4: 1
                        }
                    }
                }
            }

            for (const item of Object.entries(objPrazo)) {

                arrPrazo.push([
                    item[0],
                    item[1].d0,
                    item[1].d1,
                    item[1].d2,
                    item[1].d3,
                    item[1].d4,
                    25
                ])
            }

            arrPrazo.sort((a, b) => {
                const dateA = new Date(a[0].split('/').reverse().join('-'));
                const dateB = new Date(b[0].split('/').reverse().join('-'));
                return dateA - dateB;
            });

            const findComparativo = await Pedido.find({
                dataConclusao: { $regex: mes },
                $or: [
                    { analista: analista },
                    { analista: analistaMaisConclusoes }
                ]
            })

            const objComparativo = {}
            const arrComparativo = [['Data', 'Eu', 'Melhor']]

            for (const item of findComparativo) {
                const key = moment(item.dataConclusao).format('DD/MM/YYYY');
                const isAnalista = item.analista === analista;
                const entry = objComparativo[key] || { analista: 0, melhor: 0 };

                objComparativo[key] = {
                    analista: isAnalista ? entry.analista + 1 : entry.analista,
                    melhor: isAnalista ? entry.melhor : entry.melhor + 1,
                };
            }

            for (const item of Object.entries(objComparativo)) {

                arrComparativo.push([
                    item[0],
                    item[1].analista,
                    item[1].melhor,
                ])
            }

            arrComparativo.sort((a, b) => {
                const dateA = new Date(a[0].split('/').reverse().join('-'));
                const dateB = new Date(b[0].split('/').reverse().join('-'));
                return dateA - dateB;
            });

            console.log(arrComparativo);

            return res.json(
                {
                    arrPrazo,
                    total,
                    indeferidos,
                    naoIndeferidos,
                    cancelado,
                    naoCancelado,
                    arrComparativo
                }
            )

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    relatorioProducaoMensal: async (req, res) => {
        try {
            const { mes } = req.params;
            const start = new Date(mes);
            const end = new Date(mes);
            end.setMonth(end.getMonth() + 1);

            const startStr = start.toISOString().split('T')[0];
            const endStr = end.toISOString().split('T')[0];

            const pedidos = await Pedido.find({
                dataConclusao: { $regex: mes }
            }).lean().sort({ dataConclusao: 1 });

            let arrProd = {};

            for (const pedido of pedidos) {
                if (pedido.dataConclusao) {
                    const dataConclusao = pedido.dataConclusao;
                    const key = `${pedido.analista}-${dataConclusao}`;

                    if (!arrProd[key]) {
                        arrProd[key] = {
                            analista: pedido.analista,
                            data: dataConclusao,
                            quantidade: 0,
                            indeferidos: 0,
                            naoIndeferidos: 0,
                            cancelados: 0,
                            naoCancelados: 0
                        };
                    }

                    arrProd[key].quantidade += 1;

                    if (pedido.statusPadraoAmil === 'INDEFERIR - Em contato beneficiário confirma que não realizou pagamento') {
                        arrProd[key].indeferidos += 1;
                    } else {
                        arrProd[key].naoIndeferidos += 1;
                    }

                    if (pedido.statusGerencial === 'Protocolo Cancelado') {
                        arrProd[key].cancelados += 1;
                    } else {
                        arrProd[key].naoCancelados += 1;
                    }
                }
            }

            return res.json(Object.values(arrProd));
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            });
        }
    },

    producaoIndividualRsd: async (req, res) => {
        try {

            const { mes } = req.params

            console.log(mes);

            const meusRsds = await Pedido.find({
                dataConclusao: { $regex: mes }
            }, {
                analista: 1,
                statusPadraoAmil: 1,
                statusGerencial: 1
            }).lean()

            const contagemAnalistas = {};
            const pedidosIndeferidosIndividual = {};
            const pedidosCanceladosIndividual = {}

            // meusRsds.forEach(proposta => {
            //     const { analista } = proposta
            //     contagemAnalistas[analista] = (contagemAnalistas[analista] || 0) + 1

            //     if ((proposta.statusPadraoAmil === 'INDEFERIR - Em contato beneficiário confirma que não realizou pagamento') || (proposta.statusPadraoAmil === 'INDEFERIR - Em contato beneficiário foi confirmado fracionamento de Nota Fiscal')) {
            //         pedidosIndeferidosIndividual[analista] = (pedidosIndeferidosIndividual[analista] || 0) + 1;
            //     }

            //     if (proposta.statusGerencial === 'Protocolo Cancelado') {
            //         pedidosCanceladosIndividual[analista] = (pedidosCanceladosIndividual[analista] || 0) + 1
            //     }
            // })

            for (const proposta of meusRsds) {
                const { analista } = proposta;
                contagemAnalistas[analista] = (contagemAnalistas[analista] || 0) + 1;

                if ((proposta.statusPadraoAmil === 'INDEFERIR - Em contato beneficiário confirma que não realizou pagamento') || (proposta.statusPadraoAmil === 'INDEFERIR - Em contato beneficiário foi confirmado fracionamento de Nota Fiscal')) {
                    pedidosIndeferidosIndividual[analista] = (pedidosIndeferidosIndividual[analista] || 0) + 1;
                }

                if (proposta.statusGerencial === 'Protocolo Cancelado') {
                    pedidosCanceladosIndividual[analista] = (pedidosCanceladosIndividual[analista] || 0) + 1;
                }
            }

            const contagemAnalistasOrdenada = Object.entries(contagemAnalistas)
                .sort(([, aCount], [, bCount]) => bCount - aCount)
                .reduce((acc, [analista, count]) => {
                    acc[analista] = count;
                    return acc;
                }, {});


            return res.json({
                meusRsds,
                contagemAnalistasOrdenada,
                pedidosIndeferidosIndividual,
                pedidosCanceladosIndividual,
            })
        } catch (error) {
            console.log(error)
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    quantidadeProducaoRsd: async (req, res) => {
        try {

            const { mes } = req.params

            // Suponha que 'mes' seja uma string no formato 'YYYY-MM'
            const startDate = moment(mes, 'YYYY-MM').startOf('month').toDate();
            const endDate = moment(mes, 'YYYY-MM').add(1, 'month').startOf('month').toDate();

            const total = await Pedido.countDocuments({
                createdAt: {
                    $gte: startDate,
                    $lt: endDate
                }
            });

            const totalMesPassado = await Pedido.countDocuments({
                createdAt: {
                    $gte: moment(mes, 'YYYY-MM').subtract(1, 'month').startOf('month').toDate(),
                    $lt: moment(mes, 'YYYY-MM').startOf('month').toDate()
                }
            })

            const totalPedidosRsd = await Pedido.countDocuments({
                createdAt: {
                    $gte: startDate,
                    $lt: endDate
                },
                fila: 'RSD'
            });

            const totalPedidosMesPassadoRsd = await Pedido.countDocuments({
                createdAt: {
                    $gte: moment(mes, 'YYYY-MM').subtract(1, 'month').startOf('month').toDate(),
                    $lt: moment(mes, 'YYYY-MM').startOf('month').toDate()
                },
                fila: 'RSD'
            })

            const totalPedidosIndeferidos = await Pedido.countDocuments({
                createdAt: {
                    $gte: startDate,
                    $lt: endDate
                },
                $or: [
                    { statusPadraoAmil: 'INDEFERIR - Em contato beneficiário confirma que não realizou pagamento' },
                    { statusPadraoAmil: 'INDEFERIR - Em contato beneficiário foi confirmado fracionamento de Nota Fiscal' }
                ]
            });

            const totalPedidosMesPassadoIndeferidos = await Pedido.countDocuments({
                createdAt: {
                    $gte: moment(mes, 'YYYY-MM').subtract(1, 'month').startOf('month').toDate(),
                    $lt: moment(mes, 'YYYY-MM').startOf('month').toDate()
                },
                $or: [
                    { statusPadraoAmil: 'INDEFERIR - Em contato beneficiário confirma que não realizou pagamento' },
                    { statusPadraoAmil: 'INDEFERIR - Em contato beneficiário foi confirmado fracionamento de Nota Fiscal' }
                ]
            })

            const totalPedidosAltaFrequencia = await Pedido.countDocuments({
                createdAt: {
                    $gte: startDate,
                    $lt: endDate
                },
                fila: 'Alta Frequência Consulta'
            });

            const totalPedidosMesPassadoAltaFrequencia = await Pedido.countDocuments({
                createdAt: {
                    $gte: moment(mes, 'YYYY-MM').subtract(1, 'month').startOf('month').toDate(),
                    $lt: moment(mes, 'YYYY-MM').startOf('month').toDate()
                },
                fila: 'Alta Frequência Consulta'
            })

            const totalPedidosInativos = await Pedido.countDocuments({
                createdAt: {
                    $gte: startDate,
                    $lt: endDate
                },
                ativo: false
            });

            const totalPedidosMesPassadoInativos = await Pedido.countDocuments({
                createdAt: {
                    $gte: moment(mes, 'YYYY-MM').subtract(1, 'month').startOf('month').toDate(),
                    $lt: moment(mes, 'YYYY-MM').startOf('month').toDate()
                },
                statusProtocolo: 'Finalizado'
            })

            const totalPedidosConcluidos = await Pedido.countDocuments({
                createdAt: {
                    $gte: startDate,
                    $lt: endDate
                },
                statusProtocolo: 'Finalizado'
            });

            const totalPedidosMesPassadoConcluidos = await Pedido.countDocuments({
                createdAt: {
                    $gte: moment(mes, 'YYYY-MM').subtract(1, 'month').startOf('month').toDate(),
                    $lt: moment(mes, 'YYYY-MM').startOf('month').toDate()
                },
                statusProtocolo: 'Finalizado'
            })

            const totalPedidosAIniciar = await Pedido.countDocuments({
                createdAt: {
                    $gte: startDate,
                    $lt: endDate
                },
                status: 'A iniciar'
            });

            const totalPedidosAgendados = await Pedido.countDocuments({
                createdAt: {
                    $gte: startDate,
                    $lt: endDate
                },
                status: 'Em andamento'
            });

            const totalPedidosAguardandoContato = await Pedido.countDocuments({
                createdAt: {
                    $gte: startDate,
                    $lt: endDate
                },
                status: 'Aguardando Retorno Contato'
            });

            const totalPedidosAguardandoDocs = await Pedido.countDocuments({
                createdAt: {
                    $gte: startDate,
                    $lt: endDate
                },
                status: 'Aguardando Docs'
            });

            // const totalPedidosMesPassadoAIniciar = await Pedido.countDocuments({
            //     createdAt: {
            //         $gte: moment(mes, 'YYYY-MM').subtract(1, 'month').startOf('month').toDate(),
            //         $lt: moment(mes, 'YYYY-MM').startOf('month').toDate()
            //     },
            //     statusPadraoAmil: 'A iniciar'
            // })

            return res.status(200).json({
                total,
                totalMesPassado,
                totalPedidosRsd,
                totalPedidosMesPassadoRsd,
                totalPedidosIndeferidos,
                totalPedidosMesPassadoIndeferidos,
                totalPedidosAltaFrequencia,
                totalPedidosMesPassadoAltaFrequencia,
                totalPedidosInativos,
                totalPedidosMesPassadoInativos,
                totalPedidosConcluidos,
                totalPedidosMesPassadoConcluidos,
                totalPedidosAIniciar,
                totalPedidosAgendados,
                totalPedidosAguardandoContato,
                totalPedidosAguardandoDocs,
                // totalPedidosMesPassadoAIniciar,
            })
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    quantidadePagamentosRsd: async (req, res) => {
        try {


            const { mes } = req.params

            const startDate = moment(mes, 'YYYY-MM').startOf('month').toDate();
            const endDate = moment(mes, 'YYYY-MM').add(1, 'month').startOf('month').toDate();

            const cartaoDeCredito = await Pedido.countDocuments({
                createdAt: {
                    $gte: startDate,
                    $lt: endDate
                },
                formaPagamento: 'Cartão de Crédito'
            })

            const cartaoDeDebito = await Pedido.countDocuments({
                createdAt: {
                    $gte: startDate,
                    $lt: endDate
                },
                formaPagamento: 'Cartão de Débito'
            })

            const transfDepósito = await Pedido.countDocuments({
                createdAt: {
                    $gte: startDate,
                    $lt: endDate
                },
                formaPagamento: 'Trans./Depósito'
            })

            const cheque = await Pedido.countDocuments({
                createdAt: {
                    $gte: startDate,
                    $lt: endDate
                },
                formaPagamento: 'Cheque'
            })

            const dinheiro = await Pedido.countDocuments({
                createdAt: {
                    $gte: startDate,
                    $lt: endDate
                },
                formaPagamento: 'Dinheiro'
            })

            const boleto = await Pedido.countDocuments({
                createdAt: {
                    $gte: startDate,
                    $lt: endDate
                },
                formaPagamento: 'Boleto'
            })

            const naoInformado = await Pedido.countDocuments({
                createdAt: {
                    $gte: startDate,
                    $lt: endDate
                },
                formaPagamento: 'Não Informado'
            })

            const pagamentoNaoRealizado = await Pedido.countDocuments({
                createdAt: {
                    $gte: startDate,
                    $lt: endDate
                },
                formaPagamento: 'Pagamento não realizado'
            })

            const fracionamentoDeNotaFiscal = await Pedido.countDocuments({
                createdAt: {
                    $gte: startDate,
                    $lt: endDate
                },
                formaPagamento: 'Fracionamento de Nota Fiscal'
            })

            const comprovanteComIndicioDeFraude = await Pedido.countDocuments({
                createdAt: {
                    $gte: startDate,
                    $lt: endDate
                },
                formaPagamento: 'Comprovante com Indicio de Fraude'
            })

            return res.status(200).json({
                cartaoDeCredito,
                cartaoDeDebito,
                transfDepósito,
                cheque,
                dinheiro,
                boleto,
                naoInformado,
                pagamentoNaoRealizado,
                fracionamentoDeNotaFiscal,
                comprovanteComIndicioDeFraude,
            })
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    quantidadeStatusGerenciais: async (req, res) => {
        try {
            const { mes } = req.params

            const startDate = moment(mes, 'YYYY-MM').startOf('month').toDate();
            const endDate = moment(mes, 'YYYY-MM').add(1, 'month').startOf('month').toDate();

            const aguardandoComprovante = await Pedido.countDocuments({
                createdAt: {
                    $gte: startDate,
                    $lt: endDate
                },
                statusGerencial: 'Aguardando Comprovante'
            })

            const aguardandoRetornoContato = await Pedido.countDocuments({
                createdAt: {
                    $gte: startDate,
                    $lt: endDate
                },
                statusGerencial: 'Aguardando Retorno Contato'
            })

            const comprovanteCorreto = await Pedido.countDocuments({
                createdAt: {
                    $gte: startDate,
                    $lt: endDate
                },
                statusGerencial: 'Comprovante Correto'
            })
            const devolvidoAmil = await Pedido.countDocuments({
                createdAt: {
                    $gte: startDate,
                    $lt: endDate
                },
                statusGerencial: 'Devolvido Amil'
            })
            const pagamentoNaoRealizado = await Pedido.countDocuments({
                createdAt: {
                    $gte: startDate,
                    $lt: endDate
                },
                statusGerencial: 'Pagamento Não Realizado'
            })
            const pagoPelaAmilSemComprovante = await Pedido.countDocuments({
                createdAt: {
                    $gte: startDate,
                    $lt: endDate
                },
                statusGerencial: 'Pago pela Amil sem Comprovante'
            })
            const protocoloCancelado = await Pedido.countDocuments({
                createdAt: {
                    $gte: startDate,
                    $lt: endDate
                },
                statusGerencial: 'Protocolo Cancelado'
            })

            return res.status(200).json({
                aguardandoComprovante,
                aguardandoRetornoContato,
                comprovanteCorreto,
                devolvidoAmil,
                pagamentoNaoRealizado,
                pagoPelaAmilSemComprovante,
                protocoloCancelado,
            })
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    quantidadeStatusAmil: async (req, res) => {
        try {

            const { mes } = req.params

            const startDate = moment(mes, 'YYYY-MM').startOf('month').toDate();
            const endDate = moment(mes, 'YYYY-MM').add(1, 'month').startOf('month').toDate();

            const aIniciar = await Pedido.countDocuments({
                createdAt: {
                    $gte: startDate,
                    $lt: endDate
                },
                statusPadraoAmil: 'A Iniciar'
            })

            const AGD1 = await Pedido.countDocuments({
                createdAt: {
                    $gte: startDate,
                    $lt: endDate
                },
                statusPadraoAmil: 'AGD - Em ligação beneficiaria afirma ter pago em dinheiro, solicitando declaração de quitação'
            })

            const AGD2 = await Pedido.countDocuments({
                createdAt: {
                    $gte: startDate,
                    $lt: endDate
                },
                statusPadraoAmil: 'AGD - Em ligação beneficiaria afirma ter pago, solicitando comprovante'
            })

            const cancelamento1 = await Pedido.countDocuments({
                createdAt: {
                    $gte: startDate,
                    $lt: endDate
                },
                statusPadraoAmil: 'CANCELAMENTO - Comprovante não Recebido'
            })

            const cancelamento2 = await Pedido.countDocuments({
                createdAt: {
                    $gte: startDate,
                    $lt: endDate
                },
                statusPadraoAmil: 'CANCELAMENTO - Não reconheçe Procedimento/Consulta'
            })

            const cancelamento3 = await Pedido.countDocuments({
                createdAt: {
                    $gte: startDate,
                    $lt: endDate
                },
                statusPadraoAmil: 'CANCELAMENTO - Sem retorno pós 5 dias úteis'
            })

            const devolvidoAmil = await Pedido.countDocuments({
                createdAt: {
                    $gte: startDate,
                    $lt: endDate
                },
                statusPadraoAmil: 'Devolvido Amil'
            })

            const email = await Pedido.countDocuments({
                createdAt: {
                    $gte: startDate,
                    $lt: endDate
                },
                statusPadraoAmil: 'E-MAIL - Sem sucesso de contrato pós 3 tentativas, solicitado retorno'
            })

            const indeferir1 = await Pedido.countDocuments({
                createdAt: {
                    $gte: startDate,
                    $lt: endDate
                },
                statusPadraoAmil: 'INDEFERIR - Em contato beneficiário confirma que não realizou pagamento'
            })

            const indeferir2 = await Pedido.countDocuments({
                createdAt: {
                    $gte: startDate,
                    $lt: endDate
                },
                statusPadraoAmil: 'INDEFERIR - Em contato beneficiário foi confirmado fracionamento de Nota Fiscal'
            })

            const pagamentoLiberado = await Pedido.countDocuments({
                createdAt: {
                    $gte: startDate,
                    $lt: endDate
                },
                statusPadraoAmil: 'PAGAMENTO LIBERADO'
            })

            return res.status(200).json({
                aIniciar,
                AGD1,
                AGD2,
                cancelamento1,
                cancelamento2,
                cancelamento3,
                devolvidoAmil,
                email,
                indeferir1,
                indeferir2,
                pagamentoLiberado,
            })
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    quantidadePedidosIndeferidos: async (req, res) => {
        try {

            const { mes } = req.params

            const { analista } = req.user

            const startDate = moment(mes, 'YYYY-MM').startOf('month').toDate();
            const endDate = moment(mes, 'YYYY-MM').add(1, 'month').startOf('month').toDate();

            const pedidosIndeferidosIndividual = await Pedido.countDocuments({
                createdAt: {
                    $gte: startDate,
                    $lt: endDate
                },
                $or: [
                    { statusPadraoAmil: 'INDEFERIR - Em contato beneficiário confirma que não realizou pagamento' },
                    { statusPadraoAmil: 'INDEFERIR - Em contato beneficiário foi confirmado fracionamento de Nota Fiscal' }
                ],
                analista: analista
            });

            return res.status(200).json({
                pedidosIndeferidosIndividual,
            })
        } catch (error) {
            console.log(error);
            return res.status(200).json({
                msg: 'Internal Server Error'
            })
        }
    },

    analiticoMensal: async (req, res) => {
        try {

            const { mes } = req.params

            const startDate = moment(mes, 'YYYY-MM').startOf('month').toDate();
            const endDate = moment(mes, 'YYYY-MM').add(1, 'month').startOf('month').toDate();

            const total = await Pedido.countDocuments({
                createdAt: {
                    $gte: startDate,
                    $lt: endDate
                }
            })

            const totalMesPassado = await Pedido.countDocuments({
                createdAt: {
                    $gte: moment(mes, 'YYYY-MM').subtract(1, 'month').startOf('month').toDate(),
                    $lt: moment(mes, 'YYYY-MM').startOf('month').toDate()
                },
            })

            const totalConcluidas = await Pedido.countDocuments({
                dataConclusao: { $regex: mes },
                status: 'Finalizado',
            })

            const totalIndeferidas = await Pedido.countDocuments({
                dataConclusao: { $regex: mes },
                $or: [
                    { statusPadraoAmil: 'INDEFERIR - Em contato beneficiário confirma que não realizou pagamento' },
                    { statusPadraoAmil: 'INDEFERIR - Em contato beneficiário foi confirmado fracionamento de Nota Fiscal' }
                ],
            })

            const totalCanceladas = await Pedido.countDocuments({
                dataConclusao: { $regex: mes },
                statusGerencial: 'Protocolo Cancelado'
            })

            return res.json({
                total,
                totalMesPassado,
                totalConcluidas,
                totalIndeferidas,
                totalCanceladas,
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    producaoIndividual: async (req, res) => {
        try {

            const { mes, analista } = req.params

            const melhorAnalista = await Pedido.aggregate([
                {
                    $match: {
                        dataConclusao: { $regex: mes }
                    }
                },
                {
                    $group: {
                        _id: "$analista",
                        quantidade: { $sum: 1 }
                    }
                },
                {
                    $sort: { quantidade: -1 }
                }
            ])

            const totalAnalista = await Pedido.countDocuments({
                dataConclusao: { $regex: mes },
                analista
            })

            const totalAnalistaMesPassado = await Pedido.countDocuments({
                dataConclusao: { $regex: moment(mes).subtract(1, 'months').format('YYYY-MM') },
                analista
            })

            const totalCancelados = await Pedido.countDocuments({
                dataConclusao: { $regex: mes },
                analista,
                statusGerencial: 'Protocolo Cancelado'
            })

            const totalConcluido = await Pedido.countDocuments({
                dataConclusao: { $regex: mes },
                analista,
                statusProtocolo: 'Finalizado'
            })

            const totalIndeferido = await Pedido.countDocuments({
                dataConclusao: { $regex: mes },
                analista,
                $or: [
                    { statusPadraoAmil: 'INDEFERIR - Em contato beneficiário confirma que não realizou pagamento' },
                    { statusPadraoAmil: 'INDEFERIR - Em contato beneficiário foi confirmado fracionamento de Nota Fiscal' }
                ],
            })

            const totalIndeferidosMelhorAnalista = await Pedido.countDocuments({
                dataConclusao: { $regex: mes },
                analista: melhorAnalista[0]._id,
                $or: [
                    { statusPadraoAmil: 'INDEFERIR - Em contato beneficiário confirma que não realizou pagamento' },
                    { statusPadraoAmil: 'INDEFERIR - Em contato beneficiário foi confirmado fracionamento de Nota Fiscal' }
                ],
            })

            const totalCanceladosMelhorAnalista = await Pedido.countDocuments({
                dataConclusao: { $regex: mes },
                analista: melhorAnalista[0]._id,
                statusGerencial: 'Protocolo Cancelado'
            })

            const totalConcluidoMelhorAnalista = await Pedido.countDocuments({
                dataConclusao: { $regex: mes },
                analista: melhorAnalista[0]._id,
                statusProtocolo: 'Finalizado'
            })

            return (
                res.json({
                    totalAnalista,
                    totalAnalistaMesPassado,
                    totalCancelados,
                    totalConcluido,
                    totalIndeferido,
                    totalIndeferidosMelhorAnalista,
                    totalCanceladosMelhorAnalista,
                    totalConcluidoMelhorAnalista,
                    melhorAnalista
                })
            )

        } catch (error) {
            console.log(error)
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    comparativoProducao: async (req, res) => {
        try {

            const { mes, analista } = req.params

            const melhorAnalista = await Pedido.aggregate([
                {
                    $match: {
                        dataConclusao: { $regex: mes }
                    }
                },
                {
                    $group: {
                        _id: "$analista",
                        quantidade: { $sum: 1 }
                    }
                },
                {
                    $sort: { quantidade: -1 }
                }
            ])

            let dates = await Pedido.find({
                dataConclusao: { $regex: mes },
            }, {
                dataConclusao: 1
            }).lean()

            dates = dates.map(e => e.dataConclusao).filter((item, index, self) => self.indexOf(item) === index).sort((a, b) => new Date(a) - new Date(b))

            let series = [
                {
                    name: analista,
                    data: [],
                    type: 'bar'
                },
                {
                    name: melhorAnalista[0]._id,
                    data: [],
                    type: 'bar'
                }
            ]

            const pedidosAnalista = await Pedido.find({
                dataConclusao: { $regex: mes },
                analista
            })

            const pedidosMelhorAnalista = await Pedido.find({
                dataConclusao: { $regex: mes },
                analista: melhorAnalista[0]._id
            })

            for (const date of dates) {
                const concluidasAnalista = pedidosAnalista.filter(pedido => pedido.dataConclusao === date).length
                const concluidasMelhorAnalista = pedidosMelhorAnalista.filter(pedido => pedido.dataConclusao === date).length
                series[0].data.push({
                    x: moment(date).format('DD/MM/YYYY'),
                    y: concluidasAnalista
                })
                series[1].data.push({
                    x: moment(date).format('DD/MM/YYYY'),
                    y: concluidasMelhorAnalista
                })
            }

            return res.json(series)

        } catch (error) {
            console.log(error)
            return res.status(500).json({
                msg: 'Internal Server Error'
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

function brToAmerican(valor) {

    let valorCorreto = valor

    if (valor?.match(/./)) {
        valorCorreto = valor.replace('.', '')
    }

    if (valor?.match(/,/)) {
        valorCorreto = valorCorreto.replace(',', '.')
    }

    return Number(valorCorreto)
}

function ajustarDataPadraoAmericano(data) {

    let split = data.split('/')
    let dia = split[0]
    let mes = split[1]
    let ano = split[2]

    return `${ano}-${mes}-${dia}`

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
    moment('2023-12-25')
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