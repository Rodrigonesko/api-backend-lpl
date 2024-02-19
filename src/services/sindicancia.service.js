const sql = require('mssql')

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

module.exports = {

    getAreaEmpresa: async () => {
        try {

            await ensureConnection()

            const result = await new sql.query(`SELECT * FROM [LPLSeguros].[dbo].[AreaEmpresa]`)

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
    }
}