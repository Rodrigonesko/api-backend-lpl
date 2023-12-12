const Proposta = require('../models/Elegibilidade/PropostasElegiblidade')
const Agenda = require('../models/Elegibilidade/AgendaElegibilidade')
const Prc = require('../models/Elegibilidade/Prc')
const Blacklist = require('../models/Elegibilidade/Blacklist')
const PropostaManual = require('../models/Elegibilidade/PropostaElegibilidadeManual')
const CpfCancelado = require('../models/Elegibilidade/Cpfcancelado')
const BlacklistPlano = require('../models/Elegibilidade/BlacklistPlanos')


const path = require('path')
const moment = require('moment')
const fs = require('fs')
const multer = require('multer')
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

    getSemDocumentos: async (req, res) => {
        try {

            const propostas = await Proposta.find({
                status: 'Sem documentos'
            })

            return res.json(propostas)

        } catch (error) {
            console.log(error)
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    documentoRecebido: async (req, res) => {
        try {

            const { id } = req.body

            await Proposta.updateOne({
                _id: id
            }, {
                status: 'A iniciar'
            })

            return res.json({
                msg: 'ok'
            })

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

            console.log("analista: " + analista, "entidade: " + entidade, "status: " + status, "vigencia: " + vigencia, "fase: " + fase);

            let propostas

            if (status === 'Análise de Documentos') {
                propostas = await Proposta.find({
                    entidade,
                    status
                }).sort('vigencia')

            } else {
                propostas = await Proposta.find({
                    analista: { $regex: analista },
                    entidade: { $regex: entidade },
                    vigencia: { $regex: vigencia },
                    status: { $regex: status },
                }).sort('vigencia')
            }

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

            await Agenda.create({
                comentario: `O analista ${responsavel}, trocou a proposta que estava com o analista: ${result.analista} para o analista ${analista}.`,
                analista: responsavel,
                proposta: result.proposta,
                data: moment().format('YYYY-MM-DD HH:mm:ss')
            })

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
                await Proposta.updateOne({ _id: id }, { fase1: true, });
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

    semDocumentos: async (req, res) => {
        try {

            const { id } = req.body

            await Proposta.updateOne({
                _id: id
            }, {
                status: 'Sem documentos'
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
                };
            } else if (proposta.status3Analise || proposta.status2Analise) {
                camposAtualizados = {
                    status3Analise: 'Cancelada',
                    segundoReprotocolo1: 'Cancelada',
                    status,
                    dataConclusao: moment().format('YYYY-MM-DD'),
                };
            } else if (proposta.status1Analise) {
                camposAtualizados = {
                    status2Analise: 'Cancelada',
                    reprotocolo1: 'Cancelada',
                    status,
                    dataConclusao: moment().format('YYYY-MM-DD'),
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
                    { status: 'Análise de Documentos' },
                    { status: 'Sem documentos' }
                ]
            }).count();

            const propostas = await Proposta.find({
                $or: [
                    { status: 'Em andamento' },
                    { status: 'A iniciar' },
                    { status: 'Análise de Documentos' },
                    { status: 'Sem documentos' }
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
    },

    adicionarPlanoBlacklist: async (req, res) => {
        try {

            const { plano } = req.body

            await BlacklistPlano.create({
                plano
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

    removerPlanoBlacklist: async (req, res) => {
        try {

            const { id } = req.params

            await BlacklistPlano.findByIdAndDelete({
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

    relatorioProducao: async (req, res) => {
        try {


            const result = await Proposta.find()

            let arrProd = {}

            for (const item of result) {

                const key = `${item.analista}-${item.dataConclusao}`
                if (arrProd[key]) {
                    arrProd[key].quantidade += 1
                } else {
                    arrProd[key] = {
                        analista: item.analista,
                        data: item.dataConclusao,
                        quantidade: 1,
                        ligacao: 0
                    }
                }

                if (item.ligacao) {
                    arrProd[key].ligacao += 1
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

    produtividadeMensal: async (req, res) => {
        try {

            const { mes, analista } = req.params

            const findMelhor = await Proposta.find({
                dataConclusao: { $regex: mes }
            })

            const analistasContagem = {}

            for (const proposta of findMelhor) {
                const analista = proposta.analista
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

            const find = await Proposta.find({
                dataConclusao: { $regex: mes },
                analista
            })

            let objProducao = {}
            let objPrazo = {}
            let producao = ['']
            let arrPrazo = [['Data', 'd0', 'd1', 'd2', 'd3', 'd4+', 'meta']]
            let propostasCanceladas = 0
            let propostasNaoCanceladas = 0
            let qtdLigadas = 0
            let qtdNaoLigadas = 0
            let total = 0

            for (const item of find) {

                total++

                const key = moment(item.dataConclusao).format('DD/MM/YYYY')

                const diasUteis = calcularDiasUteis(moment(item.dataImportacao), moment(item.dataConclusao), feriados)

                if (item.status === 'Cancelada') {
                    propostasCanceladas++
                } else {
                    propostasNaoCanceladas++
                }

                if (item.ligacao) {
                    qtdLigadas++
                } else {
                    qtdNaoLigadas++
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

                if (objProducao[key]) {
                    objProducao[key].quantidade += 1
                } else {
                    objProducao[key] = {
                        quantidade: 1
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
                    35
                ])

            }

            for (const item of Object.entries(objProducao)) {
                producao.push([
                    item[0],
                    item[1].quantidade,
                    35
                ])
            }

            arrPrazo.sort((a, b) => {
                const dateA = new Date(a[0].split('/').reverse().join('-'));
                const dateB = new Date(b[0].split('/').reverse().join('-'));
                return dateA - dateB;
            });

            const findComparativo = await Proposta.find({
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

            return res.json({
                producao,
                arrPrazo,
                propostasCanceladas,
                propostasNaoCanceladas,
                qtdLigadas,
                qtdNaoLigadas,
                total,
                arrComparativo
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    voltarProposta: async (req, res) => {
        try {

            const { id } = req.body

            const { proposta } = await Proposta.findOneAndUpdate({
                _id: id
            }, {
                status: 'A iniciar'
            })

            await Agenda.create({
                comentario: `O analista: ${req.user} voltou a proposta`,
                analista: req.user,
                proposta,
                data: moment().format('YYYY-MM-DD HH:mm:ss')
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

    corrigirBase: async (req, res) => {
        try {

            uploadPropostas(req, res, async (err) => {

                // const { name, ext } = path.parse(req.file.originalname)

                let file = fs.readFileSync(req.file.path)

                const workbook = xlsx.read(file, { type: 'array' })

                const firstSheetName = workbook.SheetNames[0]

                const worksheet = workbook.Sheets[firstSheetName]

                let result = xlsx.utils.sheet_to_json(worksheet)

                for (const item of result) {
                    const categoriaCancelamento = (item['Motivo do Cancelamento Amil']);
                    const entidade = item['Entidade']
                    const motivoCancelamento = item['Motivo do Cancelamento']
                    const proposta = item.Proposta

                    await Proposta.updateOne({
                        proposta
                    }, {
                        entidade,
                        motivoCancelamento,
                        categoriaCancelamento
                    })

                    console.log(proposta, entidade,
                        motivoCancelamento,
                        categoriaCancelamento);
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

    relatorioProducaoMensal: async (req, res) => {
        try {

            const { mes } = req.params
            const start = new Date(mes);
            const end = new Date(mes);
            end.setMonth(end.getMonth() + 1);

            const startStr = start.toISOString().split('T')[0];
            const endStr = end.toISOString().split('T')[0];

            const result = await Proposta.find({
                dataConclusao: { $gte: startStr, $lt: endStr }
            }).lean().sort({ dataConclusao: 1 })


        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
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

