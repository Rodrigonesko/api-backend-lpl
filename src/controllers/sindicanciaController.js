const sql = require('mssql')
const tedious = require('tedious')

const configTedious = {

}

const config = {
    user: '',
    password: '',
    server: '',
    database: 'LPLSeuros',
    options: {
        encrypt: false,
        trustedConnection: true,
    }
}

module.exports = {
    show: async (req, res) => {
        try {

            const conn = await sql.connect(config)

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