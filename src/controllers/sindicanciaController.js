const sql = require('mssql')
const Demanda = require('../models/Sindicancia/Demanda')
const { getAreaEmpresa, getTipoServico, getStatus, getUsuarioExecao, getDemandaById, getTipoIrregularidade } = require('../services/sindicancia.service')
const moment = require('moment')

const SERVER = process.env.MSSQL_SERVER
const DATABASE = process.env.MSSQL_DATABASE
const USERNAME = process.env.MSSQL_USER
const PASSWORD = process.env.MSSQL_PASSWORD


let connection;

async function ensureConnection() {
    if (!connection) {
        const connStr = `Server=${SERVER};Database=${DATABASE};User Id=${USERNAME};Password=${PASSWORD};TrustServerCertificate=true`
        connection = await sql.connect(connStr)
    }
}

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

            const dataInicio = '2023-12-31'
            if (!data) data = moment().format('YYYY-MM-DD')

            await ensureConnection()

            const skip = (page - 1) * limit

            let filter = '';
            if (areaEmpresa) filter += ` AND Demanda.id_area_empresa = ${areaEmpresa}`;
            if (status) filter += ` AND Demanda.status_id = ${status}`;
            if (servico) filter += ` AND Demanda.tipo_servico_id = ${servico}`;
            if (analista) filter += ` AND usuario_distribuicao_id = ${analista}`;
            if (data) filter += ` AND CONVERT(date, Demanda.data_demanda) BETWEEN '${dataInicio}' AND '${data}'`;
            if (codigo) filter += ` AND Demanda.codigo LIKE '%${codigo}%'`;

            const result = await new sql.query(`
            SELECT Demanda.*, TipoServico.nome AS tipo_servico_nome, Status.nome as status_nome, Empresa.razao_social as empresa_nome, Usuario.nome as usuario_criador_nome, UsuarioDistribuicao.nome as usuario_distribuicao_nome, AreaEmpresa.nome as area_empresa_nome, TipoInvestigado.nome as tipo_investigado_nome, Finalizacao.data as data_finalizacao, Finalizacao.justificativa as justificativa_finalizacao, Pacote.data_finalizacao as data_finalizacao_sistema, UsuarioExecutor.nome as usuario_executor_nome, UsuarioExecutor.id as usuario_executor_id, Complementacao.motivo as motivo, Complementacao.data as data_complementacao, Complementacao.complementacao as complementacao
            FROM Demanda
            RIGHT JOIN TipoServico ON Demanda.tipo_servico_id = TipoServico.id
            RIGHT JOIN Status ON Demanda.status_id = Status.id
            RIGHT JOIN Empresa ON Demanda.empresa_id = Empresa.id
            RIGHT JOIN Usuario ON Demanda.usuario_criador_id = Usuario.id
            LEFT JOIN Usuario UsuarioDistribuicao ON Demanda.usuario_distribuicao_id = UsuarioDistribuicao.id
            RIGHT JOIN [LPLSeguros].[Admin].[AreaEmpresa] ON Demanda.id_area_empresa = AreaEmpresa.id
            RIGHT JOIN TipoInvestigado ON Demanda.tipo_investigado_id = TipoInvestigado.id
            LEFT JOIN Finalizacao ON Demanda.id = Finalizacao.id_demanda
            LEFT JOIN Pacote ON Demanda.id = Pacote.demanda_id
            LEFT JOIN Usuario UsuarioExecutor ON Pacote.usuario_id = UsuarioExecutor.id
            LEFT JOIN Complementacao ON Demanda.id = Complementacao.id_demanda
            WHERE 1=1 ${filter}
            ORDER BY id DESC
            OFFSET ${skip} ROWS FETCH NEXT ${limit} ROWS ONLY
            `)

            const count = await new sql.query(`
            SELECT COUNT(*) as count
            FROM Demanda
            RIGHT JOIN TipoServico ON Demanda.tipo_servico_id = TipoServico.id
            RIGHT JOIN Status ON Demanda.status_id = Status.id
            RIGHT JOIN Empresa ON Demanda.empresa_id = Empresa.id
            RIGHT JOIN Usuario ON Demanda.usuario_criador_id = Usuario.id
            LEFT JOIN Usuario UsuarioDistribuicao ON Demanda.usuario_distribuicao_id = UsuarioDistribuicao.id
            RIGHT JOIN [LPLSeguros].[Admin].[AreaEmpresa] ON Demanda.id_area_empresa = AreaEmpresa.id
            RIGHT JOIN TipoInvestigado ON Demanda.tipo_investigado_id = TipoInvestigado.id
            LEFT JOIN Finalizacao ON Demanda.id = Finalizacao.id_demanda
            LEFT JOIN Pacote ON Demanda.id = Pacote.demanda_id
            LEFT JOIN Usuario UsuarioExecutor ON Pacote.usuario_id = UsuarioExecutor.id
            WHERE 1=1 ${filter}
            `)

            // await sql.close()
            return res.json({
                demandas: result.recordset,
                count: count.recordset[0].count
            })

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

            const { id, beneficiario } = req.body

            await ensureConnection()

            const create = await sql.query(`INSERT INTO Beneficiario (id_demanda, nome) OUTPUT INSERTED.id VALUES (${id}, '${beneficiario}')`)

            if (create.rowsAffected[0] === 0) return res.json({ msg: 'Erro ao criar beneficiário' })

            const newId = create.recordset[0].id; // Aqui está o novo ID

            return res.json({
                msg: 'ok',
                id: newId // Retornando o novo ID na resposta
            })

        } catch (error) {
            console.log(error);
            return res.json({
                msg: 'Internal Server Error',
                error
            })
        }
    },

    createPrestador: async (req, res) => {
        try {

            const { id, prestador } = req.body

            await ensureConnection()

            const create = await sql.query(`INSERT INTO Prestador (id_demanda, nome) OUTPUT INSERTED.id VALUES (${id}, '${prestador}')`)

            if (create.rowsAffected[0] === 0) return res.json({ msg: 'Erro ao criar prestador' })

            const newId = create.recordset[0].id; // Aqui está o novo ID

            return res.json({
                msg: 'ok',
                id: newId // Retornando o novo ID na resposta
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

            const { id } = req.body

            await ensureConnection()

            const remove = await sql.query(`DELETE FROM Beneficiario WHERE id = ${id}`)

            if (remove.rowsAffected[0] === 0) return res.json({ msg: 'Erro ao deletar beneficiário' })

            return res.json({
                msg: 'ok'
            })

        } catch (error) {
            console.log(error);
            return res.json({
                msg: 'Internal Server Error',
                error
            })
        }
    },

    deletePrestador: async (req, res) => {
        try {

            const { id } = req.body

            await ensureConnection()

            console.log(id);

            const remove = await sql.query(`DELETE FROM Prestador WHERE id = ${id} `)

            if (remove.rowsAffected[0] === 0) return res.json({ msg: 'Erro ao deletar prestador' })

            return res.json({
                msg: 'ok'
            })

        } catch (error) {
            console.log(error);

            return res.json({
                msg: 'Internal Server Error',
                error
            })
        }
    },

    getBeneficiarios: async (req, res) => {
        try {

            const { id } = req.params

            await ensureConnection()

            const result = await new sql.query(`SELECT * FROM Beneficiario WHERE id_demanda = ${id}`)

            return res.json(result.recordset)

        } catch (error) {
            console.log(error);

            return res.json({
                msg: 'Internal Server Error',
                error
            })
        }
    },

    getPrestadores: async (req, res) => {
        try {

            const { id } = req.params

            await ensureConnection()

            const result = await new sql.query(`SELECT * FROM Prestador WHERE id_demanda = ${id}`)

            return res.json(result.recordset)

        } catch (error) {
            console.log(error);
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
    },

    relatorioDemanda: async (req, res) => {

        const { dataInicio, dataFim } = req.body

        await ensureConnection()

        const irregularidades = await new sql.query(`SELECT * FROM Irregularidade`)
        const tipoIrregularidade = await getTipoIrregularidade()

        let filter = ''

        if (dataInicio && dataFim) filter += ` AND CONVERT(date, Demanda.data_demanda) BETWEEN '${dataInicio}' AND '${dataFim}'`

        const result = await new sql.query(`
        SELECT demanda.id, demanda.codigo, demanda.nome, demanda.cpf_cnpj, demanda.cep, demanda.uf, demanda.cidade, demanda.bairro, demanda.logradouro, demanda.numero, demanda.telefone, demanda.especialidade, demanda.tipo_servico_id, demanda.observacao, demanda.status_id, demanda.data_atualizacao, demanda.empresa_id, demanda.tipo_investigado_id, demanda.data_demanda, demanda.escolha_anexo, demanda.usuario_criador_id, demanda.usuario_distribuicao_id, demanda.id_area_empresa, TipoServico.nome as tipo_servico_nome, Status.nome as status_nome, Empresa.razao_social as empresa_nome, Usuario.nome as usuario_criador_nome, UsuarioDistribuicao.nome as usuario_distribuicao_nome, AreaEmpresa.nome as area_empresa_nome, TipoInvestigado.nome as tipo_investigado_nome, Finalizacao.data as data_finalizacao, Finalizacao.justificativa as justificativa_finalizacao, Valor.valor as valor, Valor.periodo as periodo, Pacote.data_finalizacao as data_finalizacao_sistema, UsuarioExecutor.nome as usuario_executor_nome, Complementacao.motivo as motivo, Complementacao.data as data_complementacao, Complementacao.complementacao as complementacao,
        (SELECT COUNT(*) FROM Beneficiario WHERE Beneficiario.id_demanda = demanda.id) as num_beneficiarios,
        (SELECT COUNT(*) FROM Prestador WHERE Prestador.id_demanda = demanda.id) as num_prestadores
        FROM Demanda
        RIGHT JOIN TipoServico ON Demanda.tipo_servico_id = TipoServico.id
        RIGHT JOIN Status ON Demanda.status_id = Status.id
        RIGHT JOIN Empresa ON Demanda.empresa_id = Empresa.id
        RIGHT JOIN Usuario ON Demanda.usuario_criador_id = Usuario.id
        LEFT JOIN Usuario UsuarioDistribuicao ON Demanda.usuario_distribuicao_id = UsuarioDistribuicao.id
        RIGHT JOIN [LPLSeguros].[Admin].[AreaEmpresa] ON Demanda.id_area_empresa = AreaEmpresa.id
        RIGHT JOIN TipoInvestigado ON Demanda.tipo_investigado_id = TipoInvestigado.id
        LEFT JOIN Finalizacao ON Demanda.id = Finalizacao.id_demanda
        LEFT JOIN Valor ON Demanda.id = Valor.id_demanda
        LEFT JOIN Pacote ON Demanda.id = Pacote.demanda_id
        LEFT JOIN Usuario UsuarioExecutor ON Pacote.usuario_id = UsuarioExecutor.id
        LEFT JOIN Complementacao ON Demanda.id = Complementacao.id_demanda
        WHERE 1=1 ${filter}
        `)

        const demandas = result.recordset.map(demanda => {
            const irregularidadesDemanda = irregularidades.recordset.filter(irregularidade => irregularidade.id_demanda === demanda.id)
            let irregularidadesObj = {}
            tipoIrregularidade.forEach(tipo => {
                irregularidadesObj[tipo.nome] = irregularidadesDemanda.some(irregularidade => irregularidade.nome === tipo.nome) ? 1 : 0
            })
            irregularidadesObj = Object.entries(irregularidadesObj).map(([key, value]) => {
                return {
                    nome: key,
                    value
                }
            })
            return {
                ...demanda,
                irregularidadesObj
            }
        })


        return res.json(demandas)
    },

    createTipoIrregularidade: async (req, res) => {
        try {

            const { irregularidade } = req.body

            await ensureConnection()

            const create = await sql.query(`INSERT INTO TipoIrregularidade (nome) OUTPUT INSERTED.id VALUES ('${irregularidade}')`)

            if (create.rowsAffected[0] === 0) return res.json({ msg: 'Erro ao criar irregularidade' })

            const newId = create.recordset[0].id; // Aqui está o novo ID

            return res.json({
                msg: 'ok',
                id: newId // Retornando o novo ID na resposta
            })

        } catch (error) {
            return res.json({
                msg: 'Internal Server Error',
                error
            })
        }
    },

    getTipoIrregularidade: async (req, res) => {
        try {

            await ensureConnection()

            const irregularidades = await getTipoIrregularidade()

            return res.json(irregularidades)

        } catch (error) {
            return res.json({
                msg: 'Internal Server Error',
                error
            })
        }
    },

    deleteTipoIrregularidade: async (req, res) => {
        try {

            const { id } = req.params

            await ensureConnection()

            const remove = await sql.query(`DELETE FROM TipoIrregularidade WHERE id = ${id}`)

            if (remove.rowsAffected[0] === 0) return res.json({ msg: 'Erro ao deletar irregularidade' })

            return res.json({
                msg: 'ok'
            })

        } catch (error) {
            return res.json({
                msg: 'Internal Server Error',
                error
            })
        }
    },

    createIrregularidade: async (req, res) => {

        try {
            const { id_demanda, nome } = req.body

            await ensureConnection()

            const find = await new sql.query(`SELECT * FROM Irregularidade WHERE id_demanda = ${id_demanda} AND nome = '${nome}'`)

            if (find.recordset.length !== 0) return res.json({ msg: 'Irregularidade ja existe dentro da demanda' })

            const create = await sql.query(`INSERT INTO Irregularidade (id_demanda, nome) OUTPUT INSERTED.id VALUES (${id_demanda}, '${nome}')`)

            if (create.rowsAffected[0] === 0) return res.json({ msg: 'Erro ao criar irregularidade' })

            const newId = create.recordset[0].id; // Aqui está o novo ID

            console.log(create);

            return res.json({
                msg: 'ok',
                id: newId // Retornando o novo ID na resposta
            })
        } catch (error) {
            console.log(error);
            return res.json({
                msg: 'Internal Server Error',
                error
            })
        }
    },

    getIrregularidade: async (req, res) => {
        try {

            const { id } = req.params

            await ensureConnection()

            const result = await new sql.query(`SELECT * FROM Irregularidade WHERE id_demanda = ${id}`)

            return res.json(result.recordset)
        } catch (error) {
            return res.json({
                msg: 'Internal Server Error',
                error
            })
        }
    },

    deleteIrregularidade: async (req, res) => {
        try {

            const { id } = req.params

            console.log(id);

            await ensureConnection()

            const remove = await sql.query(`DELETE FROM Irregularidade WHERE id = ${id}`)

            console.log(remove);

            if (remove.rowsAffected[0] === 0) return res.json({ msg: 'Erro ao deletar irregularidade' })


            return res.json({
                msg: 'ok'
            })

        } catch (error) {
            console.log(error);
            return res.json({
                msg: 'Internal Server Error',
                error
            })
        }
    },

    createAgenda: async (req, res) => {

        try {
            const { id_demanda, observacao } = req.body

            await ensureConnection()

            console.log(id_demanda, observacao, req.user);

            const create = await sql.query(`INSERT INTO Agenda (id_demanda, data, observacao, analista) OUTPUT INSERTED.id VALUES (${id_demanda}, '${moment().format('YYYY-MM-DD HH:mm:ss')}', '${observacao}', '${req.user}')`)

            if (create.rowsAffected[0] === 0) return res.json({ msg: 'Erro ao criar agenda' })

            const newId = create.recordset[0].id; // Aqui está o novo ID

            return res.json({
                msg: 'ok',
                result: {
                    id: newId,
                    data: moment().format('YYYY-MM-DD HH:mm:ss'),
                    observacao,
                    analista: req.user,
                    id_demanda
                }
            })
        } catch (error) {
            console.log(error);
            return res.json({
                msg: 'Internal Server Error',
                error
            })
        }
    },

    getAgenda: async (req, res) => {
        try {

            const { id } = req.params

            await ensureConnection()

            const result = await new sql.query(`SELECT * FROM Agenda WHERE id_demanda = ${id}`)

            return res.json(result.recordset)
        } catch (error) {
            console.log(error);
            return res.json({
                msg: 'Internal Server Error',
                error
            })
        }
    },

    deleteAgenda: async (req, res) => {
        try {

            const { id } = req.params

            await ensureConnection()

            const remove = await sql.query(`DELETE FROM Agenda WHERE id = ${id}`)

            if (remove.rowsAffected[0] === 0) return res.json({ msg: 'Erro ao deletar agenda' })

            return res.json({
                msg: 'ok'
            })

        } catch (error) {
            return res.json({
                msg: 'Internal Server Error',
                error
            })
        }
    },

    createValor: async (req, res) => {

        try {
            const { id_demanda, valor, periodo } = req.body

            await ensureConnection()

            const find = await new sql.query(`SELECT * FROM Valor WHERE id_demanda = ${id_demanda}`)

            if (find.recordset.length !== 0) {
                const update = await sql.query(`UPDATE Valor SET valor = ${valor}, periodo = '${periodo}' WHERE id_demanda = ${id_demanda}`)
                if (update.rowsAffected[0] === 0) return res.json({ msg: 'Erro ao atualizar valor' })
                return res.json({
                    msg: 'ok',
                    result: {
                        id: find.recordset[0].id,
                        valor,
                        periodo,
                        id_demanda
                    }
                })
            }

            const create = await sql.query(`INSERT INTO Valor (id_demanda, valor, periodo) OUTPUT INSERTED.id VALUES (${id_demanda}, ${valor}, '${periodo}')`)

            if (create.rowsAffected[0] === 0) return res.json({ msg: 'Erro ao criar valor' })

            const newId = create.recordset[0].id; // Aqui está o novo ID

            return res.json({
                msg: 'ok',
                result: {
                    id: newId,
                    valor,
                    periodo,
                    id_demanda
                }
            })
        } catch (error) {
            console.log(error);
            return res.json({
                msg: 'Internal Server Error',
                error
            })
        }
    },

    getValor: async (req, res) => {
        try {

            const { id } = req.params

            await ensureConnection()

            const result = await new sql.query(`SELECT * FROM Valor WHERE id_demanda = ${id}`)

            if (result.recordset.length === 0) return res.json({ msg: 'Nenhum valor encontrado' })

            return res.json(result.recordset[0])
        } catch (error) {
            console.log(error);
            return res.json({
                msg: 'Internal Server Error',
                error
            })
        }
    },

    deleteValor: async (req, res) => {
        try {

            const { id } = req.params

            await ensureConnection()

            const remove = await sql.query(`DELETE FROM Valor WHERE id = ${id}`)

            if (remove.rowsAffected[0] === 0) return res.json({ msg: 'Erro ao deletar valor' })

            return res.json({
                msg: 'ok'
            })

        } catch (error) {
            return res.json({
                msg: 'Internal Server Error',
                error
            })
        }
    },

    finalizarDemanda: async (req, res) => {
        try {

            const { id_demanda, justificativa, data } = req.body

            await ensureConnection()

            const create = await sql.query(`INSERT INTO Finalizacao (id_demanda, justificativa, data) OUTPUT INSERTED.id VALUES (${id_demanda}, '${justificativa}', '${data}')`)

            if (create.rowsAffected[0] === 0) return res.json({ msg: 'Erro ao criar finalização' })

            const newId = create.recordset[0].id; // Aqui está o novo ID

            return res.json({
                msg: 'ok',
                result: {
                    id: newId,
                    justificativa,
                    id_demanda,
                    data: moment().format('YYYY-MM-DD HH:mm:ss')
                }
            })
        } catch (error) {
            console.log(error);
            return res.json({
                msg: 'Internal Server Error',
                error
            })
        }
    },

    quantidadeDemandasResponsaveis: async (req, res) => {
        try {

            const { mes } = req.params

            const dataInicio = moment(mes).startOf('month').toDate();
            const dataFim = moment(mes).endOf('month').toDate();
            // console.log(dataInicio, dataFim);

            await ensureConnection()

            let filter = ''

            if (dataInicio && dataFim) filter += ` Demanda.data_demanda BETWEEN '${dataInicio.toISOString()}' AND '${dataFim.toISOString()}'`

            const find = await sql.query(`
            SELECT Demanda.*, Usuario.nome as usuario_criador_nome, UsuarioDistribuicao.nome as usuario_distribuicao_nome, Status.nome as status_nome
            FROM Demanda
            JOIN Usuario ON Demanda.usuario_criador_id = Usuario.id
            JOIN Status ON Demanda.status_id = Status.id
            LEFT JOIN Usuario UsuarioDistribuicao ON Demanda.usuario_distribuicao_id = UsuarioDistribuicao.id
            WHERE ${filter}
            `)

            console.log(find);

            // const quantidadeResponsavel = []

            // find.recordset.find({
            //     usuario: usuario_distribuicao_nome
            // })

            // console.log();

            return res.json({
                msg: 'ok',
                find: find.recordset,
                // quantidadeResponsavel,
            })
        } catch (error) {
            console.log(error);
            return res.json({
                msg: 'Internal Server Error',
                error
            })
        }
    },

    createComplementacao: async (req, res) => {
        try {

            const { id_demanda, motivo, data, complementacao } = req.body

            await ensureConnection()

            console.log(id_demanda, motivo, data, complementacao);

            const find = await new sql.query(`SELECT * FROM Complementacao WHERE id_demanda = ${id_demanda}`)

            if (find.recordset.length === 0) {
                const create = await sql.query(`INSERT INTO Complementacao (id_demanda, motivo, data, complementacao) OUTPUT INSERTED.id VALUES (${id_demanda}, '${motivo}', '${data}', ${complementacao ? 1 : 0})`)

                if (create.rowsAffected[0] === 0) return res.json({ msg: 'Erro ao criar complementação' })

                const newId = create.recordset[0].id; // Aqui está o novo ID

                return res.json({
                    msg: 'ok',
                    result: {
                        id: newId,
                        complementacao,
                        id_demanda
                    }
                })
            } else {
                const update = await sql.query(`UPDATE Complementacao SET motivo = '${motivo}', data = '${data}', complementacao = ${complementacao ? 1 : 0}  WHERE id_demanda = ${id_demanda}`)

                if (update.rowsAffected[0] === 0) return res.json({ msg: 'Erro ao atualizar complementação' })

                return res.json({
                    msg: 'ok',
                    result: {
                        id: find.recordset[0].id,
                        motivo,
                        id_demanda,
                        data,
                        complementacao: find.recordset[0].complementacao + 1
                    }
                })

            }


        } catch (error) {
            console.log(error);
            return res.json({
                msg: 'Internal Server Error',
                error
            })
        }
    }
}