const sql = require('mssql')
const SERVER = process.env.MSSQL_SERVER
const DATABASE = process.env.MSSQL_DATABASE
const USERNAME = process.env.MSSQL_USER
const PASSWORD = process.env.MSSQL_PASSWORD
const moment = require('moment')
const User = require('../models/User/User')
const userService = require('./user.service')

let connection;

async function ensureConnection() {
    if (!connection) {
        const connStr = `Server=${SERVER};Database=${DATABASE};User Id=${USERNAME};Password=${PASSWORD};TrustServerCertificate=true`
        connection = await sql.connect(connStr)
    }
}

const analistas = [
    'Jessica Wachesk Carradore',
    'Hevellin Fatima dos Santos',
    'Djeinny Santos Carradore',
    'Beatriz Serena de Carvalho',
    'Kamila Regina Baiak Oliveira Torres',
    'Fernanda Aparecida Ribeiro',
    'Bárbara Cristina Nunes',
    'Camila Cristine Remus',
    'Cecilia Belli'
]

class SindicanciaService {

    constructor() {
        this.connection = null
    }

    async ensureConnection() {
        if (!this.connection) {
            const connStr = `Server=${SERVER};Database=${DATABASE};User Id=${USERNAME};Password=${PASSWORD};TrustServerCertificate=true`
            this.connection = await sql.connect(connStr)
        }
    }

    async getAreaEmpresa() {
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
    }

    async getTipoServico() {
        try {
            await ensureConnection()
            const result = await new sql.query(`SELECT * FROM [LPLSeguros].[dbo].[TipoServico]`)
            const tipos = result.recordset
            return tipos
        } catch (error) {
            return error
        }
    }

    async getStatus() {
        try {
            await ensureConnection()
            const result = await new sql.query(`SELECT * FROM [LPLSeguros].[dbo].[Status]`)
            const status = result.recordset
            return status
        } catch (error) {
            return error
        }
    }

    async getAreaTipoServico() {
        try {
            await ensureConnection()
            const result = await new sql.query(`SELECT * FROM [LPLSeguros].[Admin].[AreaTipoServico]`)
            const areasTipos = result.recordset
            return areasTipos
        } catch (error) {
            return error
        }
    }

    async getAreaUsuario() {
        try {
            await ensureConnection()
            const result = await new sql.query(`SELECT * FROM [LPLSeguros].[Admin].[AreaUsuario]`)
            const areasUsuarios = result.recordset
            return areasUsuarios
        } catch (error) {
            return error
        }
    }

    async getEmpresa() {
        try {
            await ensureConnection()
            const result = await new sql.query(`SELECT * FROM [LPLSeguros].[dbo].[Empresa]`)
            const empresas = result.recordset
            return empresas
        } catch (error) {
            return error
        }
    }

    async getTipoInvestigado() {
        try {
            await ensureConnection()
            const result = await new sql.query(`SELECT * FROM [LPLSeguros].[dbo].[TipoInvestigado]`)
            const tipos = result.recordset
            return tipos
        } catch (error) {
            return error
        }
    }

    async getTipoReembolso() {
        try {
            await ensureConnection()
            const result = await new sql.query(`SELECT * FROM [LPLSeguros].[dbo].[TipoReembolso]`)
            const tipos = result.recordset
            return tipos
        } catch (error) {
            return error
        }
    }

    async getUsuario() {
        try {
            await ensureConnection()
            const result = await new sql.query(`SELECT * FROM [LPLSeguros].[dbo].[Usuario]`)
            const usuarios = result.recordset
            return usuarios
        } catch (error) {
            return error
        }
    }

    async getUsuarioExecao() {
        try {
            await ensureConnection()
            const result = await new sql.query(`select * from Usuario where id in (select usuario_id from UsuarioPermissao where permissao_id = 4) and ativo = 1`)
            const usuarios = result.recordset
            return usuarios
        } catch (error) {
            return error
        }
    }

    async getDemandaById(id) {
        try {
            await ensureConnection()
            const result = await new sql.query(`SELECT * FROM Demanda WHERE id = ${id}`)
            const demanda = result.recordset
            return demanda
        } catch (error) {
            return error
        }
    }

    async getTipoIrregularidade() {
        try {
            await ensureConnection()
            const result = await new sql.query(`SELECT * FROM TipoIrregularidade`)
            const irregularidades = result.recordset
            return irregularidades
        } catch (error) {
            return error
        }
    }

    async alterarEnvioDePreviaBradesco(id, previaEnviada) {
        try {
            await ensureConnection()
            console.log(id, previaEnviada);
            return await new sql.query(`UPDATE DatasBradesco SET previa_enviada = '${previaEnviada}' WHERE demanda_id = '${id}'`)
        } catch (error) {
            throw error
        }
    }

    async producaoAnalistasByDate(dataInicio = moment().format('YYYY-MM-DD'), dataFim = moment().format('YYYY-MM-DD')) {
        try {
            await ensureConnection()
            const result = await new sql.Request()
                .input('dataInicio', sql.Date, dataInicio)
                .input('dataFim', sql.Date, dataFim)
                .query(`
        SELECT LogDemanda.*, Usuario.nome as nome_usuario,
        (SELECT COUNT(*) FROM Prestador WHERE id_demanda = LogDemanda.demanda_id) as prestadores,
        (SELECT COUNT(*) FROM Beneficiario WHERE id_demanda = LogDemanda.demanda_id) as beneficiarios,
        (SELECT TOP 1 fraude FROM RelatorioDemanda WHERE demanda_id = LogDemanda.demanda_id) as fraude
        FROM LogDemanda
        LEFT JOIN Usuario ON LogDemanda.usuario_id = Usuario.id
        WHERE LogDemanda.data_hora >= @dataInicio AND LogDemanda.data_hora <= @dataFim AND LogDemanda.descricao = 'Relatório final cadastrado.'
    `)

            let demandas = []
            const users = await userService.getUsersFaltasByDate(dataInicio, dataFim)

            for (const iterator of result.recordset) {
                const index = demandas.findIndex(demanda => demanda.nome_usuario === iterator.nome_usuario)
                if (index === -1) {
                    const ausenciasUsuario = users.filter(usuario => usuario.nomeCompleto === iterator.nome_usuario);
                    const totalFaltas = ausenciasUsuario.length > 0 ? ausenciasUsuario.length : 0;

                    demandas.push({
                        nome_usuario: iterator.nome_usuario,
                        demandas: 1,
                        beneficiarios: iterator.beneficiarios,
                        prestadores: iterator.prestadores,
                        fraudes: iterator.fraude ? 1 : 0,
                        faltas: totalFaltas
                    })
                } else {
                    demandas[index].demandas += 1
                    demandas[index].beneficiarios += iterator.beneficiarios
                    demandas[index].prestadores += iterator.prestadores
                    demandas[index].fraudes += iterator.fraude ? 1 : 0
                }
            }

            demandas = demandas.map(demanda => {
                return {
                    ...demanda,
                    soma: demanda.beneficiarios + demanda.prestadores
                }
            })
            return demandas
        } catch (error) {
            throw error
        }
    }

    async gerarDatasBradesco(id) {
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
                    data_final_entrega: prazoFinalizacao,
                }
            }
        } catch (error) {
            throw error
        }
    }

    async conferirDatasBradesco() {
        try {
            await ensureConnection()
            const find = await new sql.query(`
                SELECT Demanda.*, DatasBradesco.data_previa, DatasBradesco.data_final_entrega
                FROM Demanda
                LEFT JOIN DatasBradesco ON Demanda.id = DatasBradesco.demanda_id
                WHERE Demanda.id_area_empresa = 15 AND DatasBradesco.data_previa IS NULL AND DatasBradesco.data_final_entrega IS NULL
            `)
            const demandas = find.recordset
            return await Promise.all(demandas.map(async demanda => {
                return await this.gerarDatasBradesco(demanda.id)
            }))

        } catch (error) {
            throw error
        }
    }

    async createSolicitante(solicitante, id) {
        try {
            await ensureConnection()
            const find = await new sql.query(`SELECT * FROM Solicitante WHERE demanda_id = ${id}`)
            if (find.recordset.length !== 0) {
                return await this.updateSolicitante(solicitante, id)
            }
            return await new sql.query(`INSERT INTO Solicitante (analista_solicitante, demanda_id) VALUES ('${solicitante}', ${id})`)
        } catch (error) {
            throw error
        }
    }

    async updateSolicitante(solicitante, id) {
        try {
            await ensureConnection()
            return await new sql.query(`UPDATE Solicitante SET analista_solicitante = '${solicitante}' WHERE demanda_id = ${id}`)
        } catch (error) {
            throw error
        }
    }
}

module.exports = new SindicanciaService()