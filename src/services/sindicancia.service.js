const sql = require('mssql')
const SERVER = process.env.MSSQL_SERVER
const DATABASE = process.env.MSSQL_DATABASE
const USERNAME = process.env.MSSQL_USER
const PASSWORD = process.env.MSSQL_PASSWORD
const moment = require('moment')

let connection;

async function ensureConnection() {
    if (!connection) {
        const connStr = `Server=${SERVER};Database=${DATABASE};User Id=${USERNAME};Password=${PASSWORD};TrustServerCertificate=true`
        connection = await sql.connect(connStr)
    }
}

module.exports = {

    getAreaEmpresa: async () => {
        try {
            await ensureConnection()
            const result = await new sql.query(`SELECT * FROM [LPLSeguros].[Admin].[AreaEmpresa]
            RIGHT JOIN [LPLSeguros].[dbo].[Empresa] ON AreaEmpresa.empresa_id = Empresa.id
            `)
            const areas = result.recordset
            return areas
        } catch (error) {
            return error
        }
    },

    getTipoServico: async () => {
        try {
            await ensureConnection()
            const result = await new sql.query(`SELECT * FROM [LPLSeguros].[dbo].[TipoServico]`)
            const tipos = result.recordset
            return tipos
        } catch (error) {
            return error
        }
    },

    getStatus: async () => {
        try {
            await ensureConnection()
            const result = await new sql.query(`SELECT * FROM [LPLSeguros].[dbo].[Status]`)
            const status = result.recordset
            return status
        } catch (error) {
            return error
        }
    },

    getAreaTipoServico: async () => {
        try {
            await ensureConnection()
            const result = await new sql.query(`SELECT * FROM [LPLSeguros].[Admin].[AreaTipoServico]`)
            const areasTipos = result.recordset
            return areasTipos
        } catch (error) {
            return error
        }
    },

    getAreaUsuario: async () => {
        try {
            await ensureConnection()
            const result = await new sql.query(`SELECT * FROM [LPLSeguros].[Admin].[AreaUsuario]`)
            const areasUsuarios = result.recordset
            return areasUsuarios
        } catch (error) {
            return error
        }
    },

    getEmpresa: async () => {
        try {
            await ensureConnection()
            const result = await new sql.query(`SELECT * FROM [LPLSeguros].[dbo].[Empresa]`)
            const empresas = result.recordset
            return empresas
        } catch (error) {
            return error
        }
    },

    getTipoInvestigado: async () => {
        try {
            await ensureConnection()
            const result = await new sql.query(`SELECT * FROM [LPLSeguros].[dbo].[TipoInvestigado]`)
            const tipos = result.recordset
            return tipos
        } catch (error) {
            return error
        }
    },

    getTipoReembolso: async () => {
        try {
            await ensureConnection()
            const result = await new sql.query(`SELECT * FROM [LPLSeguros].[dbo].[TipoReembolso]`)
            const tipos = result.recordset
            return tipos
        } catch (error) {
            return error
        }
    },

    getUsuario: async () => {
        try {
            await ensureConnection()
            const result = await new sql.query(`SELECT * FROM [LPLSeguros].[dbo].[Usuario]`)
            const usuarios = result.recordset
            return usuarios
        } catch (error) {
            return error
        }
    },

    getUsuarioExecao: async () => {
        try {
            await ensureConnection()
            const result = await new sql.query(`select * from Usuario where id in (select usuario_id from UsuarioPermissao where permissao_id = 4) and ativo = 1`)
            const usuarios = result.recordset
            return usuarios
        } catch (error) {
            return error
        }
    },

    getDemandaById: async (id) => {
        try {
            await ensureConnection()
            const result = await new sql.query(`SELECT * FROM Demanda WHERE id = ${id}`)
            const demanda = result.recordset
            return demanda
        } catch (error) {
            return error
        }
    },

    getTipoIrregularidade: async () => {
        try {
            await ensureConnection()
            const result = await new sql.query(`SELECT * FROM TipoIrregularidade`)
            const irregularidades = result.recordset
            return irregularidades
        } catch (error) {
            return error
        }
    },

    producaoAnalistasByDate: async (dataInicio = moment().format('YYYY-MM-DD'), dataFim = moment().format('YYYY-MM-DD')) => {
        try {
            await ensureConnection()
            const result = await new sql.Request()
                .input('dataInicio', sql.Date, dataInicio)
                .input('dataFim', sql.Date, dataFim)
                .query(`
                SELECT Demanda.*, Pacote.data_finalizacao as data_finalizacao_pacote, RelatorioDemanda.fraude as fraude_relatorio, Pacote.usuario_id as usuario_pacote_id, Usuario.nome as nome_usuario,
                (SELECT COUNT (*) FROM PRESTADOR WHERE PRESTADOR.id_demanda = DEMANDA.ID) as quantidade_prestadores,
                (SELECT COUNT (*) FROM BENEFICIARIO WHERE BENEFICIARIO.id_demanda = DEMANDA.ID) as quantidade_beneficiarios
                from Demanda
                LEFT JOIN Pacote ON Demanda.id = Pacote.demanda_id
                LEFT JOIN RelatorioDemanda ON Demanda.id = RelatorioDemanda.demanda_id
                LEFT JOIN Usuario ON pacote.usuario_id = Usuario.id
                WHERE Pacote.data_finalizacao BETWEEN @dataInicio AND @dataFim
            `)

            const demandas = result.recordset.filter((demanda, index, self) =>
                index === self.findIndex((d) => (
                    d.id === demanda.id
                ))
            );

            let groupedDemandas = []

            demandas.forEach(demanda => {
                let index = groupedDemandas.findIndex(group => group.nome === demanda.nome_usuario)
                if (index === -1) {
                    groupedDemandas.push({
                        nome: demanda.nome_usuario,
                        beneficiarios: demanda.quantidade_beneficiarios,
                        prestadores: demanda.quantidade_prestadores,
                        fraudes: demanda.fraude_relatorio ? 1 : 0,
                        demandas: demandas.filter(d => d.nome_usuario === demanda.nome_usuario)
                    })
                } else {
                    groupedDemandas[index].beneficiarios += demanda.quantidade_beneficiarios
                    groupedDemandas[index].prestadores += demanda.quantidade_prestadores
                    groupedDemandas[index].fraudes += demanda.fraude_relatorio ? 1 : 0
                    groupedDemandas[index].demandas.push(demanda)
                }
            })

            return groupedDemandas.map(group => {
                return {
                    nome: group.nome,
                    demandas: group.demandas.length,
                    beneficiarios: group.beneficiarios,
                    prestadores: group.prestadores,
                    soma: group.beneficiarios + group.prestadores,
                    fraudes: group.fraudes
                }
            }).sort((a, b) => b.soma - a.soma)
        } catch (error) {
            throw error
        }
    },

    gerarDatasBradesco: async (id) => {
        try {
            await ensureConnection()
            const find = await new sql.query(`SELECT * FROM Demanda WHERE id = ${id}`)
            if (find.recordset.length === 0) return res.status(401).json({ msg: 'Demanda não encontrada' })
            const demanda = find.recordset[0]
            const dataPrevia = moment(demanda.data_demanda).businessAdd(5, 'days').format('YYYY-MM-DD')
            const prazoFinalizacao = moment(demanda.data_demanda).businessAdd(10, 'days').format('YYYY-MM-DD')
            console.log(dataPrevia, prazoFinalizacao);
            const findDatas = await new sql.query(`SELECT * FROM DatasBradesco WHERE demanda_id = ${id}`)
            if (findDatas.recordset.length !== 0) {
                const update = await sql.query(`UPDATE DatasBradesco SET data_previa = '${dataPrevia}', data_final_entrega = '${prazoFinalizacao}' WHERE demanda_id = ${id}`)
                if (update.rowsAffected[0] === 0) return res.status(401).json({ msg: 'Erro ao atualizar datas' })
                return res.json({
                    msg: 'ok',
                    result: {
                        id,
                        data_previa: dataPrevia,
                        data_final_entrega: prazoFinalizacao
                    }
                })
            }

            const update = await sql.query(`INSERT INTO DatasBradesco (demanda_id, data_previa, data_final_entrega) VALUES (${id}, '${dataPrevia}', '${prazoFinalizacao}')`)

            if (update.rowsAffected[0] === 0) return res.status(400).json({ msg: 'Erro ao criar datas' })

            return {
                msg: 'ok',
                result: {
                    id,
                    data_previa: dataPrevia,
                    data_final_entrega: prazoFinalizacao
                }
            }
        } catch (error) {
            throw error
        }
    }
}