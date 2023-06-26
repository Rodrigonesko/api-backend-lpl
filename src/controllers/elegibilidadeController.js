const mongoose = require('mongoose')
const Proposta = mongoose.model('PropostasElegibilidade')
const Agenda = mongoose.model('AgendaElegibilidade')
const Prc = mongoose.model('Prc')
const Blacklist = require('../models/Elegibilidade/Blacklist')
const PropostaManual = require('../models/Elegibilidade/PropostaElegibilidadeManual')
const CpfCancelado = require('../models/Elegibilidade/Cpfcancelado')
const BlacklistPlano = require('../models/Elegibilidade/BlacklistPlanos')

const path = require('path')
const moment = require('moment')
const fs = require('fs')
const multer = require('multer')
const os = require('os')
const xlsx = require('xlsx')

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = './uploads/elegibilidade/'
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

const uploadPropostas = multer({ storage }).single('file')

const mysql = require('mysql');

const connection = mysql.createConnection({
    host: '10.0.0.71', // endereço do servidor do MySQL
    user: 'adm', // usuário do MySQL
    password: 'lpladm$1', // senha do MySQL
    database: 'elegibilidade' // nome do banco de dados
});

// Conectar ao banco de dados
connection.connect((err) => {
    if (err) {
        console.error('Erro ao conectar ao MySQL:', err);
        return;
    }
    console.log('Conexão bem-sucedida ao MySQL!');
});


module.exports = {

    show: async (req, res) => {

        try {

            const propostas = await Proposta.find()

            return res.json(propostas)

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }

    },

    upload: async (req, res) => {
        try {

            // Mapeamento dos estados para suas siglas
            const ufMap = {
                'São Paulo': 'SP',
                'Rio de Janeiro': 'RJ',
                'Distrito Federal': 'DF'
            };

            let qtd = 0

            // Função para processar o upload das propostas
            uploadPropostas(req, res, async (err) => {

                const { name, ext } = path.parse(req.file.originalname)


                if (ext == '.txt') {

                    // Processamento de arquivo de texto

                    // Leitura síncrona do arquivo em formato Latin-1
                    let data = fs.readFileSync(req.file.path, { encoding: 'latin1' })
                    let listaArr = data.split('\n');                 // Divisão do conteúdo em linhas
                    let arrAux = listaArr.map(e => {                 // Mapeamento das linhas para arrays
                        return e.split('#')
                    })

                    for await (const item of arrAux) {
                        let vigencia = item[36]

                        if (vigencia) {
                            vigencia = ajustarData(vigencia)
                        }
                        let proposta = item[22]
                        let produto = item[6]
                        let plano = item[48]
                        let produtor = item[7]
                        const uf = ufMap[item[3]] || item[3];
                        let administradora = item[8]
                        let codCorretor = item[33]
                        let corretor = item[34]
                        let entidade = item[28]

                        if (entidade?.indexOf('UBE') == 0) {
                            entidade = 'UBE'
                        }

                        if (entidade?.indexOf('ASPROFILI') == 0) {
                            entidade = 'ASPROFILI'
                        }

                        let tipoVinculo = item[9]
                        let nome = item[35]
                        let idade = item[37]
                        let numeroVidas = item[46]
                        let valorMedico = item[51]
                        let valorDental = item[52]
                        let valorTotal = item[53]
                        let supervisor = item[21]
                        let situacao = item[44]

                        if (situacao == 'Implantada') {
                            // Atualiza o status da proposta para 'Implantada'
                            await Proposta.findOneAndUpdate({
                                proposta
                            }, {
                                status: 'Implantada'
                            })
                        }

                        if (situacao == 'Pronta para análise') {

                            const find = await Proposta.findOne({
                                proposta
                            })

                            if (!find) { // Cria uma nova proposta caso não exista
                                await Proposta.create({
                                    proposta,
                                    vigencia,
                                    produto,
                                    produtor,
                                    uf,
                                    administradora,
                                    codCorretor,
                                    corretor,
                                    entidade,
                                    tipoVinculo,
                                    nome,
                                    idade,
                                    numeroVidas,
                                    valorMedico,
                                    valorDental,
                                    valorTotal,
                                    status: 'Análise de Documentos',
                                    supervisor,
                                    plano,
                                    dataImportacao: moment(new Date).format('YYYY-MM-DD')
                                })

                                qtd++
                            }
                        }
                    }
                } else {
                    // Processamento de arquivo Excel
                    // Leitura síncrona do arquivo
                    let file = fs.readFileSync(req.file.path)

                    // Leitura do arquivo Excel
                    const workbook = xlsx.read(file, { type: 'array' })

                    // Obtém o nome da primeira planilha
                    const firstSheetName = workbook.SheetNames[0]

                    // Obtém a planilha
                    const worksheet = workbook.Sheets[firstSheetName]

                    // Converte a planilha em JSON
                    let result = xlsx.utils.sheet_to_json(worksheet)

                    // Filtra as propostas com status 'Pronta para análise' ou 'Em análise'
                    result = result.filter((e) => { return e['Situação Atual'] === 'Pronta para análise' || e['Situação Atual'] === 'Em análise' })

                    for (const item of result) {

                        const dataImportacao = moment().format('YYYY-MM-DD')
                        const proposta = item.Proposta
                        const statusMotor = item.Score_motor

                        let vigencia = ExcelDateToJSDate(item['Vigência Beneficiario'])
                        vigencia.setDate(vigencia.getDate() + 1)
                        vigencia = moment(vigencia).format('YYYY-MM-DD')

                        const produto = item['Linha de Produto']
                        const produtor = item['Cód. Adm.']
                        const uf = item['Nome da Unidade']
                        const administradora = item['Nome da Administradora']
                        const codCorretor = item['Cód.Corretor']
                        const nomeCorretor = item['Nome Corretor']
                        const entidade = item['Nome Fantasia Contrato Médico']
                        const tipoVinculo = item['Classificação Prof. Médica']
                        const nome = item.Titular
                        const idade = item['Idade Beneficiário']
                        const numeroVidas = item['Nro Vidas Médico']
                        const valorMedico = item['Valor Médico']
                        const valorDental = item['Valor Dental']
                        const valorTotal = item['Valor Total']
                        const nomeSupervisor = item['Nome Supervisor']

                        const existeProposta = await Proposta.findOne({
                            proposta
                        })

                        const obj = {
                            dataImportacao,
                            proposta,
                            statusMotor,
                            vigencia,
                            produto,
                            produtor,
                            uf,
                            administradora,
                            codCorretor,
                            nomeCorretor,
                            entidade,
                            tipoVinculo,
                            nome,
                            idade,
                            numeroVidas,
                            valorMedico,
                            valorDental,
                            valorTotal,
                            nomeSupervisor,
                            status: 'Análise de Documentos',
                        }

                        if (!existeProposta) {
                            // Cria uma nova proposta caso não exista
                            await Proposta.create(obj)
                            qtd++

                        } else if (statusMotor !== '#N/D') {
                            // Atualiza o status do motor da proposta
                            await Proposta.updateOne({
                                proposta
                            },
                                statusMotor
                            )
                        }
                    }
                }

                return res.status(200).json({
                    qtd
                })

            })


        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    mostrarAnaliseDoc: async (req, res) => {
        try {

            const propostas = await Proposta.find({
                status: 'Análise de Documentos'
            })

            return res.status(200).json({
                propostas,
                total: propostas.length
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    atribuirAnalistaPre: async (req, res) => {
        try {

            const { id, analista } = req.body

            if (req.userAcessLevel === 'false') {

                console.log(req.userAcessLevel);

                return res.status(500).json({
                    msg: 'O usuário não tem permissão para trocar de Analista'
                })

            }

            const proposta = await Proposta.findByIdAndUpdate({
                _id: id
            }, {
                analista: analista,
                status: 'A iniciar'
            })

            return res.status(200).json({
                proposta
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    mostrarInfoPropostaId: async (req, res) => {
        try {

            const { id } = req.params

            const proposta = await Proposta.findById({
                _id: id
            })

            return res.status(200).json({
                proposta
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    propostasAnalistaPorStatus: async (req, res) => {
        try {

            // Obtém os parâmetros analista e status da requisição
            const { analista, status } = req.params;

            // Cria um objeto de consulta vazio
            let query = {};

            // Verifica se o parâmetro analista é diferente de 'Todos' e vazio
            if (analista !== 'Todos' && analista !== '') {
                // Define a propriedade analista na consulta com o valor do parâmetro analista
                query.analista = analista;
            }

            // Verifica o valor do parâmetro status
            if (status === 'Andamento') {
                // Se for 'Andamento', define a propriedade status na consulta com os valores 'A iniciar' ou 'Em andamento'
                query.status = { $in: ['A iniciar', 'Em andamento'] };
            } else {
                // Caso contrário, define a propriedade status na consulta com o valor do parâmetro status
                query.status = status;
            }

            // Executa a consulta no banco de dados utilizando o modelo Proposta e a consulta definida
            const propostas = await Proposta.find(query).sort('vigencia');

            // Retorna uma resposta com status 200 contendo as propostas encontradas e o total de propostas
            return res.status(200).json({
                propostas,
                total: propostas.length
            });

        } catch (error) {
            console.log(error)
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    entidades: async (req, res) => {
        try {

            const { status } = req.params;

            // Cria um array vazio para armazenar as entidades
            let entidades = [];

            // Verifica o valor do parâmetro status
            if (status === 'andamento') {
                // Se for 'andamento', realiza uma consulta no banco de dados para encontrar as entidades
                // cujo status seja 'A iniciar' ou 'Em andamento'
                entidades = await Proposta.find({
                    $or: [
                        { status: 'A iniciar' },
                        { status: 'Em andamento' }
                    ]
                }).distinct('entidade');
            } else {
                // Caso contrário, realiza uma consulta no banco de dados para encontrar as entidades
                // cujo status seja igual ao valor do parâmetro status
                entidades = await Proposta.find({
                    status
                }).distinct('entidade');
            }

            // Retorna uma resposta com status 200 contendo o array de entidades encontradas
            return res.status(200).json({
                entidades
            });

        } catch (error) {
            console.log(error)
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    filtro: async (req, res) => {

        try {

            const { analista, entidade, status, vigencia, fase } = req.query

            let propostas = await Proposta.find({
                analista: { $regex: analista },
                entidade: { $regex: entidade },
                vigencia: { $regex: vigencia },
                status: { $regex: status },

            }).sort('vigencia')

            if (fase === 'Analise') {
                propostas = propostas.filter(e => {
                    return e.status === 'A iniciar' || e.status === 'Em andamento'
                })
            }

            return res.status(200).json({
                propostas
            })

        } catch (error) {
            console.log(error)
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }

    },

    filtroProposta: async (req, res) => {
        try {
            const { proposta, status } = req.params

            console.log(proposta, status);

            let propostas = []

            if (status === 'Andamento') {

                console.log('entrou aqui');

                propostas = await Proposta.find({
                    $or: [
                        {
                            proposta: { $regex: proposta },
                            status: 'A iniciar'
                        }, {
                            proposta: { $regex: proposta },
                            status: 'Em andamento'
                        }
                    ]
                }).sort('vigencia')
            } else if (status === 'Todas') {
                propostas = await Proposta.find({
                    proposta: { $regex: proposta }
                }).sort('vigencia')
            } else {
                propostas = await Proposta.find({
                    proposta: { $regex: proposta },
                    status
                }).sort('vigencia')
            }

            return res.status(200).json({
                propostas
            })

        } catch (error) {
            console.log(error)
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    atribuirAnalista: async (req, res) => {
        try {

            const { analista, id } = req.body

            const responsavel = req.user

            const result = await Proposta.findOne({
                _id: id
            })

            await Proposta.findByIdAndUpdate({
                _id: id
            }, {
                analista
            })

            const teste = await Agenda.create({
                comentario: `O analista ${responsavel}, trocou a proposta que estava com o analista: ${result.analista} para o analista ${analista}.`,
                analista: responsavel,
                proposta: result.proposta,
                data: moment().format('YYYY-MM-DD HH:mm:ss')
            })

            console.log(teste);

            return res.status(200).json({
                msg: 'ok'
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error
            })
        }
    },

    statusEmAndamento: async (req, res) => {
        try {

            const { id } = req.body

            await Proposta.updateOne({
                _id: id
            }, {
                status: 'Em andamento'
            })

            return res.status(200).json({
                msg: 'Ok'
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error
            })
        }
    },

    fase1: async (req, res) => {
        try {

            const { id, dataUpdate, concluir } = req.body;

            console.log(id, dataUpdate, concluir);

            // Verifica se a variável concluir é verdadeira
            if (concluir) {
                // Atualiza a proposta com o ID fornecido, definindo fase1 como true e status como 'Em andamento'
                await Proposta.updateOne({ _id: id }, { fase1: true });
            }

            // Procura e atualiza a proposta com o ID fornecido, utilizando os dados fornecidos em dataUpdate
            // A opção new: true faz com que o método retorne o documento atualizado
            const result = await Proposta.findOneAndUpdate({ _id: id }, dataUpdate, { new: true })?.lean();

            // Verifica se a variável result contém um documento atualizado
            if (result) {
                // Retorna uma resposta com status 200 contendo o documento atualizado
                return res.status(200).json(result);
            } else {
                // Caso contrário, lança um erro informando que a proposta não foi encontrada
                throw new Error("Proposta não encontrada");
            }


        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    fase2: async (req, res) => {
        try {

            const { id, dataUpdate } = req.body;

            console.log(id, dataUpdate);

            // Procura e atualiza a proposta com o ID fornecido, utilizando os dados fornecidos em dataUpdate
            // A opção new: true faz com que o método retorne o documento atualizado
            const result = await Proposta.findOneAndUpdate({ _id: id }, dataUpdate, { new: true })?.lean();

            // Verifica se a variável result contém um documento atualizado
            if (result) {
                // Retorna uma resposta com status 200 contendo o documento atualizado
                return res.status(200).json(result);
            } else {
                // Caso contrário, lança um erro informando que a proposta não foi encontrada
                throw new Error("Proposta não encontrada");
            }


        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    comentario: async (req, res) => {
        try {

            const { comentario, id } = req.body

            const { proposta } = await Proposta.findOne({ _id: id })

            const result = await Agenda.create({
                comentario,
                proposta,
                analista: req.user,
                data: moment().format('YYYY-MM-DD HH:mm:ss')
            })

            console.log(result);

            return res.status(200).json(result)

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    buscarAgenda: async (req, res) => {
        try {

            const { id } = req.params

            const { proposta } = await Proposta.findOne({ _id: id })

            const agenda = await Agenda.find({
                proposta
            })

            console.log(agenda);

            return res.status(200).json(agenda)

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    excluirComentario: async (req, res) => {
        try {
            const { id } = req.params

            const agenda = await Agenda.findByIdAndDelete({
                _id: id
            })

            return res.status(200).json({
                agenda
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    buscarPrc: async (req, res) => {
        try {

            const prc = await Prc.find()

            return res.status(200).json({
                prc
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    enviarUnder: async (req, res) => {
        try {

            const { id, erroSistema } = req.body;

            // Procura a proposta com o ID fornecido
            const find = await Proposta.findById({ _id: id });

            console.log(find);

            let status = '';
            let camposAtualizados = {};

            // Define o valor da variável status com base na presença da variável erroSistema
            status = erroSistema ? 'Erro Sistema' : 'Enviada para Under';

            // Verifica se find.status1Analise não está definido
            if (!find.status1Analise) {
                camposAtualizados = {
                    status1Analise: 'Liberada',
                    primeiraDevolucao1: 'Liberada',
                    status,
                    dataConclusao: moment().format('YYYY-MM-DD'),
                    analista: req.user
                };
            }
            // Verifica se find.status3Analise ou find.status2Analise estão definidos
            else if (find.status3Analise || find.status2Analise) {
                camposAtualizados = {
                    status3Analise: 'Liberada',
                    segundoReprotocolo1: 'Liberada',
                    status,
                    dataConclusao: moment().format('YYYY-MM-DD'),
                    analista: req.user
                };
            }
            // Caso contrário, find.status1Analise está definido
            else if (find.status1Analise) {
                camposAtualizados = {
                    status2Analise: 'Liberada',
                    reprotocolo1: 'Liberada',
                    status,
                    dataConclusao: moment().format('YYYY-MM-DD'),
                    analista: req.user
                };
            }

            // Verifica se há campos a serem atualizados
            if (Object.keys(camposAtualizados).length > 0) {
                // Atualiza a proposta com os campos fornecidos em camposAtualizados
                await Proposta.findByIdAndUpdate({ _id: id }, camposAtualizados);
            }

            // Retorna uma resposta com status 200 contendo um objeto JSON com a mensagem "Ok"
            const respostaJson = { msg: 'Ok' };
            return res.status(200).json(respostaJson);


        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    enviarFaseCancelamento: async (req, res) => {
        try {

            const { id, motivoCancelamento, categoriaCancelamento, evidencia } = req.body

            console.log(id, motivoCancelamento, categoriaCancelamento, evidencia);

            await Proposta.updateOne({
                _id: id
            }, {
                motivoCancelamento,
                categoriaCancelamento,
                evidenciaFraude: evidencia,
                status: 'Fase Cancelamento',
                dataConclusao: moment().format('YYYY-MM-DD'),
                analista: req.user
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

    devolver: async (req, res) => {
        try {

            const { id, motivos, observacoes } = req.body;

            // Procura a proposta com o ID fornecido
            const find = await Proposta.findById({ _id: id });

            const status = 'Devolvida';

            let camposAtualizados = {};

            if (!find.primeiraDevolucao1) {
                // Define os valores das variáveis primeiraDevolucao1, primeiraDevolucao2, primeiraDevolucao3 e primeiraDevolucao4
                const primeiraDevolucao1 = motivos[0];
                const primeiraDevolucao2 = motivos[1];
                const primeiraDevolucao3 = motivos[2];
                const primeiraDevolucao4 = motivos[3];

                camposAtualizados = {
                    status1Analise: 'Devolvida',
                    primeiraDevolucao1,
                    primeiraDevolucao2,
                    primeiraDevolucao3,
                    primeiraDevolucao4,
                    observacoesDevolucao: observacoes,
                    status,
                    dataConclusao: moment().format('YYYY-MM-DD'),
                    analista: req.user
                };
            } else if (find.primeiraDevolucao1 && !find.reprotocolo1) {
                // Define os valores das variáveis reprotocolo1, reprotocolo2 e reprotocolo3
                const reprotocolo1 = motivos[0];
                const reprotocolo2 = motivos[1];
                const reprotocolo3 = motivos[2];

                camposAtualizados = {
                    status2Analise: 'Devolvida',
                    reprotocolo1,
                    reprotocolo2,
                    reprotocolo3,
                    observacoesDevolucao: observacoes,
                    status,
                    dataConclusao: moment().format('YYYY-MM-DD'),
                    analista: req.user
                };
            } else if (find.primeiraDevolucao1 && find.reprotocolo1) {
                console.log('terceira devolução');

                // Define os valores das variáveis segundoReprotocolo1, segundoReprotocolo2 e segundoReprotocolo3
                const segundoReprotocolo1 = motivos[0];
                const segundoReprotocolo2 = motivos[1];
                const segundoReprotocolo3 = motivos[2];

                camposAtualizados = {
                    status3Analise: 'Devolvida',
                    segundoReprotocolo1,
                    segundoReprotocolo2,
                    segundoReprotocolo3,
                    observacoesDevolucao: observacoes,
                    status,
                    dataConclusao: moment().format('YYYY-MM-DD'),
                    analista: req.user
                };
            }

            if (Object.keys(camposAtualizados).length > 0) {
                // Atualiza a proposta com os campos fornecidos em camposAtualizados
                await Proposta.updateOne({ _id: id }, camposAtualizados);
            }

            // Retorna uma resposta com status 200 contendo um objeto JSON com a mensagem "Ok"
            return res.json({
                msg: 'ok'
            });


        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    cancelar: async (req, res) => {
        try {

            const { id } = req.body

            const proposta = await Proposta.findOne({
                _id: id
            })

            const status = 'Cancelada'

            if (!proposta.status1Analise) {
                camposAtualizados = {
                    status1Analise: 'Cancelada',
                    primeiraDevolucao1: 'Cancelada',
                    status,
                    dataConclusao: moment().format('YYYY-MM-DD'),
                    analista: req.user
                };
            } else if (proposta.status3Analise || proposta.status2Analise) {
                camposAtualizados = {
                    status3Analise: 'Cancelada',
                    segundoReprotocolo1: 'Cancelada',
                    status,
                    dataConclusao: moment().format('YYYY-MM-DD'),
                    analista: req.user
                };
            } else if (proposta.status1Analise) {
                camposAtualizados = {
                    status2Analise: 'Cancelada',
                    reprotocolo1: 'Cancelada',
                    status,
                    dataConclusao: moment().format('YYYY-MM-DD'),
                    analista: req.user
                };
            }

            if (Object.keys(camposAtualizados).length > 0) {
                await Proposta.updateOne({ _id: id }, camposAtualizados);
            }

            if (proposta.corretor) {
                await Blacklist.create({
                    proposta: proposta.proposta,
                    codCorretor: proposta.codCorretor,
                    entidade: proposta.entidade,
                    administradora: proposta.administradora,
                    cpfCorretor: proposta.cpfCorretor,
                    nomeCorretor: proposta.nomeCorretor,
                    telefoneCorretor: proposta.telefoneCorretor,
                    nomeSupervisor: proposta.nomeSupervisor,
                    cpfSupervisor: proposta.cpfSupervisor,
                    telefoneSupervisor: proposta.telefoneSupervisor,
                    motivoCancelamento: proposta.motivoCancelamento,
                    categoriaCancelamento: proposta.categoriaCancelamento,
                    evidenciaFraude: proposta.evidenciaFraude
                })
            }



            return res.json({ msg: 'ok' })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    producaoDiaria: async (req, res) => {
        try {
            const { data } = req.params;

            // Procura as propostas com a data de conclusão fornecida
            const propostas = await Proposta.find({
                dataConclusao: data
            });

            let analistas = [];

            // Percorre as propostas e adiciona os analistas únicos à lista de analistas
            propostas.forEach(e => {
                if (!analistas.includes(e.analista)) {
                    analistas.push(e.analista);
                }
            });

            let producao = [];

            // Para cada analista, conta o número de propostas concluídas na data fornecida
            for (const analista of analistas) {
                const count = await Proposta.find({
                    analista,
                    dataConclusao: data
                }).count();

                producao.push({
                    analista,
                    quantidade: count
                });
            }

            // Conta o número total de propostas concluídas na data fornecida
            const total = await Proposta.find({
                dataConclusao: data
            }).count();

            // Retorna uma resposta com status 200 contendo um objeto JSON com a produção por analista e o total
            return res.json({
                producao,
                total
            });


        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    propostasCorretor: async (req, res) => {
        try {

            const { corretor } = req.params

            const propostas = await Proposta.find({
                nomeCorretor: corretor
            })

            return res.json(propostas)

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    blacklist: async (req, res) => {
        try {

            const propostas = await Blacklist.find()

            return res.json(propostas)

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    report: async (req, res) => {
        try {

            const recebidasHoje = await Proposta.find({
                dataImportacao: moment().format('YYYY-MM-DD')
            }).count();

            const emAnalise = await Proposta.find({
                dataImportacao: { $ne: moment().format('YYYY-MM-DD') },
                $or: [
                    { status: 'Em andamento' },
                    { status: 'A iniciar' },
                    { status: 'Análise de Documentos' }
                ]
            }).count();

            const propostas = await Proposta.find({
                $or: [
                    { status: 'Em andamento' },
                    { status: 'A iniciar' },
                    { status: 'Análise de Documentos' }
                ]
            });

            const vigencias = [];

            // Percorre as propostas e conta a quantidade de propostas para cada vigência
            propostas.forEach(proposta => {
                const { vigencia } = proposta;
                const indice = vigencias.findIndex((item) => item.vigencia === vigencia);

                if (indice === -1) {
                    vigencias.push({ vigencia, quantidade: 1 });
                } else {
                    vigencias[indice].quantidade++;
                }
            });

            const totalEmAnalise = propostas.length;

            // Cria um objeto contendo os valores obtidos
            const obj = {
                recebidasHoje,
                emAnalise,
                totalEmAnalise,
                vigencias
            };

            // Retorna uma resposta com status 200 contendo o objeto JSON com as informações
            return res.json(obj);

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    registroPropostaManual: async (req, res) => {
        try {

            const { dadosProposta } = req.body

            await PropostaManual.create(dadosProposta)

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

    showPropostasManual: async (req, res) => {
        try {

            const propostas = await PropostaManual.find()

            return res.json(propostas)

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    showPropostasManualAndamento: async (req, res) => {
        try {

            const propostas = await PropostaManual.find({
                status: 'Em andamento'
            })

            return res.json(propostas)

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    atualizarObservacoes: async (req, res) => {

        try {

            const { observacoes, id } = req.body

            await PropostaManual.updateOne({
                _id: id
            }, {
                observacoes
            })

            return res.json({ msg: 'ok' })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }

    },

    concluirPropostaManual: async (req, res) => {

        try {

            const { id } = req.body

            await PropostaManual.updateOne({
                _id: id
            }, {
                status: 'Concluido'
            })

            return res.json({ msg: 'ok' })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }

    },

    cancelarCpf: async (req, res) => {
        try {

            const { dados } = req.body

            await CpfCancelado.create(dados)

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

    consultaCpfCancelado: async (req, res) => {
        try {

            const { cpf } = req.params

            const result = await CpfCancelado.findOne({
                cpfCorretor: cpf
            })

            if (!result) {
                return res.json({
                    msg: 'Não achou'
                })
            }

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

    salvarDiploma: async (req, res) => {
        try {

            const { dados } = req.body

            const { universidade, curso, numeroRegistro } = dados

            await Proposta.updateOne({
                _id: dados.id
            }, {
                universidade,
                curso,
                numeroRegistro
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

    buscarDiploma: async (req, res) => {
        try {

            const { universidade, curso, numeroRegistro, id } = req.body.dados

            if (!universidade || !curso || !numeroRegistro) {
                const diplomas = []

                return res.json(diplomas)
            }

            const diplomas = await Proposta.find({
                universidade,
                curso,
                numeroRegistro,
                _id: { $ne: id }
            })

            return res.json(diplomas)

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    buscarUniversidades: async (req, res) => {
        try {

            const result = await Proposta.aggregate([
                {
                    $group: {
                        _id: null, // Usamos null para agrupar todos os documentos em um único grupo
                        universidades: { $addToSet: "$universidade" }
                    }
                }
            ])

            const universidades = result[0].universidades

            return res.json(universidades)

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    buscarCursos: async (req, res) => {
        try {

            const result = await Proposta.aggregate([
                {
                    $group: {
                        _id: null, // Usamos null para agrupar todos os documentos em um único grupo
                        cursos: { $addToSet: "$curso" }
                    }
                }
            ])

            const cursos = result[0].cursos

            return res.json(cursos)

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    divergencias: async (req, res) => {
        try {

            uploadPropostas(req, res, async (err) => {

                let data = fs.readFileSync(req.file.path, { encoding: 'latin1' })
                let listaArr = data.split('\n');
                let arrAux = listaArr.map(e => {
                    return e.split('#')
                })

                const statusAmil = ['Pronta para análise', 'Em análise', 'Em Análise Técnica']
                const statusBanco = ['Enviada para Under', 'Erro Sistema', 'Cancelada', 'A iniciar']

                arrAux = arrAux.filter(item => {
                    return statusAmil.find(status => status === item[44])
                })

                const arr = []

                //const propostas = await Proposta.find()

                for (const item of arrAux) {

                    const result = await Proposta.findOne({
                        proposta: item[22]
                    })

                    if (statusBanco.find(status => status === result.status)) {

                        arr.push({
                            statusBanco: result.status,
                            statusAmil: item[44],
                            proposta: item[22]
                        })

                    }

                }

                return res.json({ propostas: arr })

            })

            // return res.json({ msg: 'ok' })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error',
                error
            })
        }
    },

    migrarBanco: async (req, res) => {

        try {
            connection.query("SELECT * FROM analise", async (err, rows) => {
                if (err) {
                    console.log(err);
                    return
                }

                for (const item of rows) {

                    if (item.enviadaUnder === 'Pré Processamento') {
                        item.enviadaUnder = 'A iniciar'
                    }

                    var mapeamento = {
                        Samantha: "Samantha Maciel Giazzon",
                        Gerson: "Gerson Douglas",
                        Djeinny: "Djeinny Carradore",
                        Matheus: "Matheus Lopes",
                        Daniele: "Daniele Silva",
                        Vanessa: "Vanessa Passos da Silva",
                        Barbara: "Bárbara Cristina Nunes",
                        Claudia: "Cecilia Belli",
                        Fernanda: "Fernanda Ribeiro",
                        Denise: "Denise Gonçalves Vargas",
                        Luciana: "Luciana Tavares",
                        Jessica: "Jéssica Wachesk",
                        Camila: "Camila Cristine Remus",
                        Ana: "Ana Paula Brás",
                        Giovana: "Giovana Santana",
                        Allana: "Allana Silva",
                        Hevellin: "Hevellin Santos",
                        Eduarda: "Eduarda Mayworm",
                        Isabelle: "Isabelle Silva",
                        Sandra: "Sandra Santos",
                        Michelle: "Michelle Jonsson"
                    };

                    var nomeAntigo = item.analistaResponsavel;
                    if (mapeamento.hasOwnProperty(nomeAntigo)) {
                        item.analistaResponsavel = mapeamento[nomeAntigo];
                    }

                    if (item.ligacao?.toLowerCase() === 'sim') {
                        item.ligacao = true
                    } else if (item.ligacao?.toLowerCase() === 'não' || item.ligacao?.toLowerCase() === 'nao') {
                        item.ligacao = false
                    } else {
                        item.ligacao = undefined
                    }

                    if (item.documento_identificacao?.toLowerCase() === 'sim') {
                        item.documento_identificacao = true
                    } else if (item.documento_identificacao?.toLowerCase() === 'não' || item.documento_identificacao?.toLowerCase() === 'nao') {
                        item.documento_identificacao = false
                    } else {
                        item.documento_identificacao = undefined
                    }

                    if (item.declaracao_associado_carteirinha?.toLowerCase() === 'sim') {
                        item.declaracao_associado_carteirinha = true
                    } else if (item.declaracao_associado_carteirinha?.toLowerCase() === 'não' || item.declaracao_associado_carteirinha?.toLowerCase() === 'nao') {
                        item.declaracao_associado_carteirinha = false
                    } else {
                        item.declaracao_associado_carteirinha = undefined
                    }

                    let vinculadosSimNao = undefined

                    if (item.vinculados) {
                        vinculadosSimNao = true
                    }

                    if (item.plano_anterior?.toLowerCase() === 'sim') {
                        item.plano_anterior = true
                    } else if (item.plano_anterior?.toLowerCase() === 'não' || item.plano_anterior?.toLowerCase() === 'nao') {
                        item.plano_anterior = false
                    } else {
                        item.plano_anterior = undefined
                    }

                    if (item.sisamil_deacordo?.toLowerCase() === 'sim') {
                        item.sisamil_deacordo = true
                    } else if (item.sisamil_deacordo?.toLowerCase() === 'não' || item.sisamil_deacordo?.toLowerCase() === 'nao') {
                        item.sisamil_deacordo = false
                    } else {
                        item.sisamil_deacordo = undefined
                    }

                    if (item.site?.toLowerCase() === 'sim') {
                        item.site = true
                    } else if (item.site?.toLowerCase() === 'não' || item.site?.toLowerCase() === 'nao') {
                        item.site = false
                    } else {
                        item.site = undefined
                    }

                    let fase1 = false

                    if (item.finalizada_pre) {
                        fase1 = true
                    }


                    const obj = {
                        dataImportacao: ajustarData(item.dataImportacao),
                        vigencia: item.inicioVigencia,
                        proposta: item.proposta,
                        statusMotor: item.statusMotor,
                        status: item.enviadaUnder,
                        status1Analise: item.status1analise,
                        status2Analise: item.status2analise,
                        status3Analise: item.status3analise,
                        produto: item.produto,
                        plano: item.plano,
                        produtor: item.produtor,
                        uf: item.uf,
                        administradora: item.administradora,
                        codCorretor: item.codCorretor,
                        nomeCorretor: item.corretor,
                        entidade: item.entidade,
                        tipoVinculo: item.tipoVinculo,
                        nome: item.nomeTitular,
                        idade: item.idadeBeneficiario,
                        numeroVidas: item.numeroVidas,
                        valorMedico: item.valorMedico,
                        valorDental: item.valorDental,
                        valorTotal: item.valorTotal,
                        primeiraDevolucao1: item.primeiraDevolucao1,
                        primeiraDevolucao2: item.primeiraDevolucao2,
                        primeiraDevolucao3: item.primeiraDevolucao3,
                        primeiraDevolucao4: item.primeiraDevolucao4,
                        reprotocolo1: item.reprotocolo1,
                        reprotocolo2: item.reprotocolo2,
                        reprotocolo3: item.reprotocolo3,
                        segundoReprotocolo1: item.segundoReprotocolo1,
                        segundoReprotocolo2: item.segundoReprotocolo2,
                        segundoReprotocolo3: item.segundoReprotocolo3,
                        observacoesDevolucao: item.segundoReprotocolo4,
                        analista: item.analistaResponsavel,
                        dataConclusao: item.finalizada ? ajustarData(item.finalizada) : undefined,
                        ligacao: item.ligacao,
                        prc: item.pontosDeAtencao,
                        motivoCancelamento: item.motivoCancelamento,
                        evidenciaFraude: item.evidenciaFraude,
                        cpfCorretor: item.cpf_corretor,
                        telefoneCorretor: item.telefone_corretor,
                        nomeSupervisor: item.supervisor,
                        cpfSupervisor: item.cpf_supervisor,
                        telefoneSupervisor: item.telefone_supervisor,
                        cpf: item.cpf_titular,
                        planoAmil: item.plano_amil,
                        dataInicioPlanoAmil: item.data_inicio_plano_amil,
                        dataFimPlanoAmil: item.data_fim_plano_amil,
                        custoPlanoAmil: item.custo_plano_amil,
                        documentoIdentificacao: item.documento_identificacao,
                        declaracaoAssociadoCarteirinha: item.declaracao_associado_carteirinha,
                        vinculados: item.vinculados,
                        vinculadosSimNao,
                        planoAnterior: item.plano_anterior,
                        faltaDoc: item.falta_doc,
                        sisAmilDeacordo: item.sisamil_deacordo,
                        site: item.site,
                        contrato: item.contrato,
                        analistaPreProcessamento: item.analista_1,
                        dataConclusaoPre: item.finalizada_pre ? ajustarData(item.finalizada_pre) : undefined,
                        observacoes: item.observacoes,
                        categoriaCancelamento: item.categoria_cancelamento,
                        fase1
                    }

                    await Proposta.create(obj)

                }

                return res.json({ msg: 'oi' })
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }

    },

    adicionarUniversidades: async (req, res) => {
        try {

            connection.query("SELECT * FROM blacklist_diplomas GROUP BY proposta", async function (err, result, fields) {
                if (err) throw err;

                for (const item of result) {
                    await Proposta.updateOne({
                        proposta: item.proposta
                    }, {
                        numeroRegistro: item.n_registro,
                        universidade: item.universidade,
                        curso: item.curso
                    })

                }


                return res.json(result.length)
            });

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    adicionarBlacklist: async (req, res) => {
        try {

            connection.query("SELECT * FROM analise WHERE enviadaUnder = 'Cancelada'", async function (err, result, fields) {
                if (err) throw err;

                for (const item of result) {

                    await Blacklist.create({
                        proposta: item.proposta,
                        codCorretor: item.codCorretor,
                        entidade: item.entidade,
                        administradora: item.administradora,
                        cpfCorretor: item.cpf_corretor,
                        telefoneCorretor: item.telefone_corretor,
                        nomeCorretor: item.corretor,
                        nomeSupervisor: item.supervisor,
                        cpfSupervisor: item.cpf_supervisor,
                        telefoneSupervisor: item.telefone_supervisor,
                        motivoCancelamento: item.motivoCancelamento,
                        categoriaCancelamento: item.categoria_cancelamento,
                        evidenciaFraude: item.evidenciaFraude
                    })
                }


                return res.json(result.length)
            });

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    adicionarPropostaManual: async (req, res) => {
        try {

            connection.query("SELECT * FROM registros", async function (err, result, fields) {
                if (err) throw err;

                for (const item of result) {

                    await PropostaManual.create({
                        data: item.data,
                        proposta: item.proposta,
                        beneficiario: item.beneficiario,
                        confirmacao: item.confirmacao,
                        meioSolicitacao: item.meio_solicitacao,
                        meioConfirmacao: item.meio_confirmacao,
                        resultado: item.resultado,
                        responsavel: item.responsavel,
                        observacoes: item.observacoes,
                        status: item.status,
                        dataConclusao: item.finalizado,
                        dataInclusao: item.data,
                    })
                }


                return res.json(result.length)
            });

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    planosBlacklist: async (req, res) => {
        try {

            const planos = await BlacklistPlano.find()

            return res.json(planos)

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    }

}

function ajustarData(data) {
    let split = data.split('/')
    let dia = split[0]
    let mes = split[1]
    let ano = split[2]

    return `${ano}-${mes}-${dia}`
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