const sql = require('mssql')

const server = process.env.MSSQL_SERVER
const database = process.env.MSSQL_DATABASE
const username = process.env.MSSQL_USER
const password = process.env.MSSQL_PASSWORD

module.exports = {
    show: async (req, res) => {
        try {

            const connStr = `Server=${server};Database=${database};User Id=${username};Password=${password};TrustServerCertificate=true`

            const conn = await sql.connect(connStr)

            const result = await sql.query("SELECT * FROM usuario")


            Object.keys(result).forEach(e => {
                console.log(e);
            })

            result.recordset.forEach(e => {
                console.log(e);
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