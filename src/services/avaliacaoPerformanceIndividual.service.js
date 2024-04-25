const moment = require("moment")
const elegibilidadeService = require("../services/elegibilidade.service")
const elegibilidadePmeService = require("../services/elegibilidadePme.service")
const rsdService = require("../services/rsd.service")
const teleEntrevistaService = require("../services/teleEntrevista.service")
const sindicanciaService = require("../services/sindicancia.service")
const nodemailer = require('nodemailer')

module.exports = {
    rendimentoTodasCelulas: async (dataInicio = moment().format('YYYY-MM-DD'), dataFim = moment().format("YYYY-MM-DD")) => {

        try {
            const producaoElegibilidadePme = await elegibilidadePmeService.producaoIndividualElegibilidadePme(dataInicio, dataFim)
            const producaoElegibilidade = await elegibilidadeService.producaoIndividualElegibilidade(dataInicio, dataFim)
            const producaoRsd = await rsdService.producaoIndividualRsd(dataInicio, dataFim)
            const { result } = await teleEntrevistaService.quantidadeAnalistasPorMes(dataInicio, dataFim)
            const producaoSindicancia = await sindicanciaService.producaoAnalistasByDate(dataInicio, dataFim)

            let html = `
        <div style="font-family: Arial, sans-serif;">
            <h1>Rendimento de todas as células das datas ${moment(dataInicio).format("DD/MM/YYYY")} até ${moment(dataFim).format("DD/MM/YYYY")}</h1>
            <h2>Elegibilidade PME</h2>
            <table
                border='1'
            >
                <thead>
                    <tr>
                        <th>Analista</th>
                        <th>Total</th>
                        <th>Concluidas</th>
                        <th>Devolvidas</th>
                        <th>Redistribuidas</th>
                        <th>A iniciar</th>
                    </tr>
                </thead>
                <tbody>
        `

            producaoElegibilidadePme.forEach(item => {
                html += `
                <tr>
                    <td>${item.analista}</td>
                    <td>${item.total}</td>
                    <td>${item.concluidas}</td>
                    <td>${item.devolvidas}</td>
                    <td>${item.redistribuidas}</td>
                    <td>${item.aIniciar}</td>
                </tr>
            `
            })

            html += `
                </tbody>
            </table>
        `

            html += `
            <h2>Elegibilidade</h2>
            <table
                border='1'
            >
                <thead>
                    <tr>
                        <th>Analista</th>
                        <th>Total</th>
                        <th>Concluídas</th>
                        <th>Devolvidas</th>
                        <th>Canceladas</th>
                    </tr>
                </thead>
                <tbody>
        `

            producaoElegibilidade.forEach(item => {
                html += `
                <tr>
                    <td>${item.analista}</td>
                    <td>${item.total}</td>
                    <td>${item.implantadas}</td>
                    <td>${item.devolvidas}</td>
                    <td>${item.canceladas}</td>
                </tr>
            `
            })

            html += `
                </tbody>
            </table>
        `

            html += `
            <h2>RSD</h2>
            <table
                border='1'
            >
                <thead>
                    <tr>
                        <th>Analista</th>
                        <th>Total</th>
                        <th>Cancelados</th>
                        <th>Indeferidos</th>
                        <th>Aguardando Comprovante</th>
                        <th>Aguardando Retorno Contato</th>
                        <th>Comprovante Correto</th>
                        <th>Devolvido Amil</th>
                        <th>Pago pela Amil sem Comprovante</th>
                        <th>A iniciar</th>
                    </tr>
                </thead>
                <tbody>
        `

            producaoRsd.forEach(item => {
                html += `
                <tr>
                    <td>${item.analista}</td>
                    <td>${item.total}</td>
                    <td>${item.cancelados}</td>
                    <td>${item.indeferidos}</td>
                    <td>${item.aguardandoComprovante}</td>
                    <td>${item.aguardandoRetornoContato}</td>
                    <td>${item.comprovanteCorreto}</td>
                    <td>${item.devolvidoAmil}</td>
                </tr>
            `
            })

            html += `
                </tbody>
            </table>
        `

            html += `
            <h2>Tele Entrevista</h2>
            <table
                border='1'
            >
                <thead>
                    <tr>
                        <th>Analista</th>
                        <th>Total</th>
                        <th>Média</th>
                        <th>Houve divergência</th>
                        <th>Média divergência</th>
                    </tr>
                </thead>
                <tbody>
        `
            result.forEach(item => {
                html += `
                <tr>
                    <td>${item.analista}</td>
                    <td>${item.total}</td>
                    <td>${item.media.toFixed(2)}</td>
                    <td>${item.houveDivergencia}</td>
                    <td>${item.mediaDivergencia.toFixed(2)}%</td>
                </tr>
            `
            })

            html += `   
                </tbody>
            </table>
        `

            html += `
            <h2>Sindicância</h2>
            <table
                border='1'
            >
                <thead>
                    <tr>
                        <th>Analista</th>
                        <th>Demandas</th>
                        <th>Beneficiários</th>
                        <th>Prestadores</th>
                        <th>Benef + Prest</th>
                        <th>Fraudes</th>
                    </tr>
                </thead>
                <tbody>
        `
            producaoSindicancia.forEach(item => {
                html += `
                <tr>
                    <td>${item.nome}</td>
                    <td>${item.demandas}</td>
                    <td>${item.beneficiarios}</td>
                    <td>${item.prestadores}</td>
                    <td>${item.soma}</td>
                    <td>${item.fraudes}</td>
                </tr>
            `
            })

            html += `
                </tbody>
            </table>
            </div>
        `

            const transporter = nodemailer.createTransport({
                host: 'email-ssl.com.br',
                port: 465,
                secure: true,
                auth: {
                    user: process.env.EMAIL,
                    pass: process.env.PASSWORD
                }
            })

            return await transporter.sendMail({
                from: `Leonardo Lonque <${process.env.EMAIL}>`,
                to: "rodrigo.dias@lplseguros.com.br, leonardo.lonque@lplseguros.com.br, administrador@lplseguros.com.br, claudia.rieth@lplseguros.com.br, luciana@lplseguros.com.br, cecilia.belli@lplseguros.com.br, sgiazzon@lplseguros.com.br",
                subject: "Rendimento de todas as células",
                text: "Rendimento de todas as células",
                html
            })

        } catch (error) {
            console.log(error);
            const transporter = nodemailer.createTransport({
                host: 'email-ssl.com.br',
                port: 465,
                secure: true,
                auth: {
                    user: process.env.EMAIL,
                    pass: process.env.PASSWORD
                }
            })
            await transporter.sendMail({
                from: `Leonardo Lonque <${process.env.EMAIL}>`,
                to: "rodrigo.dias@lplseguros.com.br, leonardo.lonque@lplseguros.com.br",
                subject: "Erro ao gerar relatório de rendimento de todas as células",
                text: "Erro ao gerar relatório de rendimento de todas as células",
            })
            throw error
        }
    }
}
