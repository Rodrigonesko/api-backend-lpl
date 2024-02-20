const sql = require('mssql')
const Demanda = require('../models/Sindicancia/Demanda')
const { getAreaEmpresa, getTipoServico, getStatus, getUsuarioExecao, getDemandaById } = require('../services/sindicancia.service')

const SERVER = process.env.MSSQL_SERVER
const DATABASE = process.env.MSSQL_DATABASE
const USERNAME = process.env.MSSQL_USER
const PASSWORD = process.env.MSSQL_PASSWORD

// const objDemanda = {
//     id: 3202,
//     codigo: '202400108',
//     nome: 'LEONARDO COHEN ZAIDE SCHLANGER - ANALISE PF',
//     cpf_cnpj: '161.014.857-65',
//     cep: '22421000',
//     uf: 'RJ',
//     cidade: 'Rio de Janeiro',
//     bairro: 'Ipanema',
//     logradouro: 'Rua Barão de Jaguaripe',
//     numero: '29 - COMPL 101',
//     telefone: '(21) 97698-9004',
//     especialidade: 'DIVERSAS',
//     tipo_servico_id: 23, // tabela TipoServico
//     observacao: 'Análise de beneficiário devido ao alto grau de custo médico',
//     status_id: 2, // tabela Status
//     data_atualizacao: 2024-02-16T16:50:42.337Z,
//     empresa_id: 3, // tabela Empresa
//     tipo_investigado_id: 7, // tabela TipoInvestigado
//     data_demanda: 2024-02-16T16:50:35.253Z,
//     escolha_anexo: null,
//     usuario_criador_id: 68, // tabela Usuario
//     usuario_distribuicao_id: null, // tabela Usuario
//     id_area_empresa: 1 // tabela AreaEmpresa
//   }

module.exports = {
    getDemandas: async (req, res) => {
        try {

            let { limit, page, areaEmpresa, status, servico, analista, codigo, data } = req.query

            if (limit === undefined) limit = 10
            if (page === undefined) page = 1

            const connStr = `Server=${SERVER};Database=${DATABASE};User Id=${USERNAME};Password=${PASSWORD};TrustServerCertificate=true`
            await sql.connect(connStr)
            const skip = (page - 1) * limit

            let filter = '';
            if (areaEmpresa) filter += ` AND Demanda.id_area_empresa = ${areaEmpresa}`;
            if (status) filter += ` AND Demanda.status_id = ${status}`;
            if (servico) filter += ` AND Demanda.tipo_servico_id = ${servico}`;
            if (analista) filter += ` AND Demanda.usuario_criador_id = ${analista}`;
            if (data) filter += ` AND Demanda.data_demanda = '${data}'`;
            if (codigo) filter += ` AND Demanda.codigo LIKE '%${codigo}%'`;

            const result = await new sql.query(`
            SELECT demanda.id, demanda.codigo, demanda.nome, demanda.cpf_cnpj, demanda.cep, demanda.uf, demanda.cidade, demanda.bairro, demanda.logradouro, demanda.numero, demanda.telefone, demanda.especialidade, demanda.tipo_servico_id, demanda.observacao, demanda.status_id, demanda.data_atualizacao, demanda.empresa_id, demanda.tipo_investigado_id, demanda.data_demanda, demanda.escolha_anexo, demanda.usuario_criador_id, demanda.usuario_distribuicao_id, demanda.id_area_empresa, TipoServico.nome AS tipo_servico_nome, Status.nome as status_nome, Empresa.razao_social as empresa_nome, Usuario.nome as usuario_criador_nome, UsuarioDistribuicao.nome as usuario_distribuicao_nome, AreaEmpresa.nome as area_empresa_nome, TipoInvestigado.nome as tipo_investigado_nome
            FROM Demanda
            RIGHT JOIN TipoServico ON Demanda.tipo_servico_id = TipoServico.id
            RIGHT JOIN Status ON Demanda.status_id = Status.id
            RIGHT JOIN Empresa ON Demanda.empresa_id = Empresa.id
            RIGHT JOIN Usuario ON Demanda.usuario_criador_id = Usuario.id
            RIGHT JOIN Usuario UsuarioDistribuicao ON Demanda.usuario_distribuicao_id = UsuarioDistribuicao.id
            RIGHT JOIN [LPLSeguros].[Admin].[AreaEmpresa] ON Demanda.id_area_empresa = AreaEmpresa.id
            RIGHT JOIN TipoInvestigado ON Demanda.tipo_investigado_id = TipoInvestigado.id
            WHERE 1=1 ${filter}
            ORDER BY id DESC
            OFFSET ${skip} ROWS FETCH NEXT ${limit} ROWS ONLY
            `)

            // await sql.close()
            return res.json(result.recordset)

        } catch (error) {
            console.log(error);
            return res.json({
                msg: 'Internal Server Error',
                error
            })
        }
    },

    getAreaEmpresa: async (req, res) => {
        try {
            const areas = await getAreaEmpresa()
            console.log(areas);
            return res.json(areas)
        } catch (error) {
            return res.json({
                msg: 'Internal Server Error',
                error
            })
        }
    },
    getTipoServico: async (req, res) => {
        try {
            const tipos = await getTipoServico()
            return res.json(tipos)
        } catch (error) {
            return res.json({
                msg: 'Internal Server Error',
                error
            })
        }
    },

    getStatus: async (req, res) => {
        try {
            const status = await getStatus()
            return res.json(status)
        } catch (error) {
            return res.json({
                msg: 'Internal Server Error',
                error
            })
        }
    },

    getAnalistasExecucao: async (req, res) => {
        try {
            let analistas = await getUsuarioExecao()
            analistas = analistas.map(analista => {
                return {
                    id: analista.id,
                    nome: analista.nome,
                    email: analista.email
                }
            })
            return res.json(analistas)
        } catch (error) {
            return res.json({
                msg: 'Internal Server Error',
                error
            })
        }
    },

    createBeneficiario: async (req, res) => {
        try {

            const { nome, demanda } = req.body

            const find = await Demanda.findOne({ demandaId: demanda.demandaId })

            if (find) {
                await Demanda.updateOne({ demandaId: demanda.demandaId }, demanda)
                await Demanda.updateOne({ demandaId: demanda.demandaId }, {
                    $push: {
                        beneficiarios: nome
                    }
                })
            } else {
                await Demanda.create(demanda)
                await Demanda.updateOne({ demandaId: demanda.demandaId }, {
                    $push: {
                        beneficiarios: nome
                    }
                })
            }

            return res.json({
                msg: 'Beneficiário criado com sucesso'
            })

        } catch (error) {
            return res.json({
                msg: 'Internal Server Error',
                error
            })
        }
    },

    createPrestador: async (req, res) => {
        try {

            const { nome, demanda } = req.body

            const find = await Demanda.findOne({ demandaId: demanda.demandaId })

            if (find) {
                await Demanda.updateOne({ demandaId: demanda.demandaId }, demanda)
                await Demanda.updateOne({ demandaId: demanda.demandaId }, {
                    $push: {
                        prestadores: nome
                    }
                })
            } else {
                await Demanda.create(demanda)
                await Demanda.updateOne({ demandaId: demanda.demandaId }, {
                    $push: {
                        prestadores: nome
                    }
                })
            }

            return res.json({
                msg: 'Prestador criado com sucesso'
            })
        } catch (error) {
            return res.json({
                msg: 'Internal Server Error',
                error
            })
        }
    },

    deleteBeneficiario: async (req, res) => {
        try {
            const { nome, demanda } = req.body
            await Demanda.updateOne({ demandaId: demanda.demandaId }, {
                $pull: {
                    beneficiarios: nome
                }
            })
            return res.json({
                msg: 'Beneficiário deletado com sucesso'
            })
        } catch (error) {
            return res.json({
                msg: 'Internal Server Error',
                error
            })
        }
    },

    deletePrestador: async (req, res) => {
        try {
            const { nome, demanda } = req.body
            await Demanda.updateOne({ demandaId: demanda.demandaId }, {
                $pull: {
                    prestadores: nome
                }
            })
            return res.json({
                msg: 'Prestador deletado com sucesso'
            })
        } catch (error) {
            return res.json({
                msg: 'Internal Server Error',
                error
            })
        }
    },

    getDemandaById: async (req, res) => {
        try {
            const { id } = req.params

            const find = await Demanda.findById(id)

            const demanda = await getDemandaById(id)

            return res.json({
                demanda,
                dadosDemanda: find
            })

        } catch (error) {
            return res.json({
                msg: 'Internal Server Error',
                error
            })
        }
    }

}