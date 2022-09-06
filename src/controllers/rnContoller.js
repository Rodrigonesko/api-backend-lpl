const mongoose = require('mongoose')
const Rn = mongoose.model('Rn')


module.exports = {
    upload: async (req, res) => {
        try {
            
            const result = req.body

            // console.log(result.result);

            let quantidade = 0

            result.result.forEach(async e=>{
                let dia = ExcelDateToJSDate(e.DATA).getDate() + 1
                let mes = ExcelDateToJSDate(e.DATA).getMonth() + 1
                let ano = ExcelDateToJSDate(e.DATA).getFullYear()
                
                const data = `${dia}/${mes}/${ano}`
                
                const beneficiario = e['BENFICIÁRIO'];

                const mo = e.MO

                const proposta = e.PROPOSTA

                dia = ExcelDateToJSDate(e.VIGENCIA).getDate() + 1
                mes = ExcelDateToJSDate(e.VIGENCIA).getMonth() + 1
                ano = ExcelDateToJSDate(e.VIGENCIA).getFullYear()

                const vigencia =  `${dia}/${mes}/${ano}`

                const pedido = e['PEDIDO/PROPOSTA']

                const tipo = e.TIPO

                const filial = e.FILIAL

                const idade = e.IDADE

                dia = ExcelDateToJSDate(e['DATA RECEBIMENTO DO PEDIDO']).getDate() 
                mes = ExcelDateToJSDate(e['DATA RECEBIMENTO DO PEDIDO']).getMonth()
                ano = ExcelDateToJSDate(e['DATA RECEBIMENTO DO PEDIDO']).getFullYear()

                const dataRecebimento = `${dia}/${mes}/${ano}`

                const procedimento = e.PROCEDIMENTO

                const doenca = e['DOENÇA']

                const cid = e.CID

                const periodo = e['PERÍODO DA DOENÇA']

                const prc = e.PRC

                const telefones = e['TELEFONES BENEFICIARIO']

                const email = e['EMAIL BENEFICIARIO']

                const resultado = {
                    data,
                    beneficiario,
                    mo,
                    proposta,
                    vigencia,
                    pedido,
                    tipo,
                    filial,
                    idade,
                    dataRecebimento,
                    procedimento,
                    doenca,
                    cid,
                    periodo,
                    prc,
                    telefones,
                    email
                }

                console.log(resultado);

                const newRn = await Rn.create(resultado)

                quantidade++

                console.log(newRn);

            })



            return res.status(200).json({message: `Foram inseridos ${quantidade} novas`})
        } catch (error) {
            console.log(error);
        }
    }
}

function ExcelDateToJSDate(serial) {
    var utc_days = Math.floor(serial - 25569);
    var utc_value = utc_days * 86400;
    var date_info = new Date(utc_value * 1000);

    var fractional_day = serial - Math.floor(serial) + 0.0000001;

    var total_seconds = Math.floor(86400 * fractional_day);

    var seconds = total_seconds % 60;

    total_seconds -= seconds;

    var hours = Math.floor(total_seconds / (60 * 60));
    var minutes = Math.floor(total_seconds / 60) % 60;

    return new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate(), hours, minutes, seconds);
}