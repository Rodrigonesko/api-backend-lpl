const sql = require('mssql')
const tedious = require('tedious')

const configTedious = {

}

const config = {
    user: 'AdminAPI',
    password: '*Sl2u8h73',
    server: 'lplseguros.com',
    database: 'LPLSeguros',
    options: {
        cryptoCredentialsDetails: {
            minVersion: 'TLSv1'
        }
    }
}

module.exports = {
    show: async (req, res) => {
        try {
            const connStr = "Server=lplseguros.com;Database=LPL;User Id=AdminAPI;Password=*Sl2u8h73;TrustServerCertificate=True";

            const conn = await sql.connect(connStr)

            console.log(conn);

            // const result = await sql.query("SELECT * FROM ")

            // console.log(result);

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