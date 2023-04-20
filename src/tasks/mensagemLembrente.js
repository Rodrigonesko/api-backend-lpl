const { default: axios } = require('axios')
const jwt = require('jsonwebtoken')
const secret = process.env.JWT_SECRET
const moment = require('moment')

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);
const TwilioNumber = process.env.TWILIO_NUMBER

async function lembreteMensagem() {

    const token = jwt.sign({ username: 'Admin' }, secret)

    const resp = await axios.post(`${process.env.API_TELE}/lembreteMensagem`, {

    }, {
        withCredentials: true,
        headers: {
            Authorization: `Bearer ${token}`
        }
    })

    console.log(resp.data);
}

// Função para verificar se o tempo entre duas datas é de aproximadamente 10 minutos
function verificarTempoEntreDatas(date1, date2) {
    // Calcula a diferença em milissegundos entre as duas datas
    const diferencaEmMilissegundos = Math.abs(date2 - date1);

    // Compara a diferença em milissegundos com 10 minutos em milissegundos
    const dezMinutosEmMilissegundos = 600000;
    console.log(diferencaEmMilissegundos);
    return diferencaEmMilissegundos >= (dezMinutosEmMilissegundos - 300000) && diferencaEmMilissegundos <= (dezMinutosEmMilissegundos + 300000);
}


module.exports = lembreteMensagem