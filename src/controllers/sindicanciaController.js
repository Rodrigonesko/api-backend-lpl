const sql = require('mssql')

const server = process.env.MSSQL_SERVER
const database = process.env.MSSQL_DATABASE
const username = process.env.MSSQL_USER
const password = process.env.MSSQL_PASSWORD

module.exports = {
    produtividade: async (req, res) => {
        try {

            const connStr = `Server=${server};Database=${database};User Id=${username};Password=${password};TrustServerCertificate=true`

            await sql.connect(connStr)

            const demandas = await sql.query("SELECT * FROM Demanda")
            const usuarios = await sql.query("SELECT * FROM usuario")

            demandas.recordset.forEach(demanda => {
                console.log(demanda);
            })

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
    }
}