const sql = require('mssql')

const SERVER = process.env.MSSQL_SERVER
const DATABASE = process.env.MSSQL_DATABASE
const USERNAME = process.env.MSSQL_USER
const PASSWORD = process.env.MSSQL_PASSWORD

module.exports = {
    getDemandas: async (req, res) => {
        try {

            const { limit, page } = req.query

            const connStr = `Server=${SERVER};Database=${DATABASE};User Id=${USERNAME};Password=${PASSWORD};TrustServerCertificate=true`

            await sql.connect(connStr)

            const skip = (page - 1) * limit

            const demandas = await sql.query(`SELECT * FROM demanda ORDER BY id DESC OFFSET ${skip} ROWS FETCH NEXT ${limit} ROWS ONLY`)

            await sql.close()

            console.log(demandas);

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