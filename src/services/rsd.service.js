const Pedido = require('../models/Rsd/Pedido');
const moment = require('moment');
const User = require('../models/User/User');
const userService = require('./user.service');

module.exports = {
    producaoIndividualRsd: async (dataInicio = moment().format('YYYY-MM-DD'), dataFim = moment().format("YYYY-MM-DD")) => {
        try {

            const pedidos = await Pedido.find({
                createdAt: {
                    $gte: dataInicio,
                    $lte: dataFim
                }
            }, {
                analista: 1,
                statusGerencial: 1,
                pacote: 1
            }).lean()

            const qtdPacoteAnalista = pedidos.reduce((acc, pedido) => {
                if (!pedido.analista) {
                    return acc
                }
                if (!acc[pedido.analista]) {
                    acc[pedido.analista] = {
                        pacotes: {},
                        count: 0
                    }
                }
                if (!acc[pedido.analista].pacotes[pedido.pacote]) {
                    acc[pedido.analista].pacotes[pedido.pacote] = true
                    acc[pedido.analista].count += 1
                }
                return acc
            }, {})

            const users = await userService.getUsersFaltasByDate(dataInicio, dataFim)
            let producao = []

            for (const pedido of pedidos) {

                if (!pedido.analista) {
                    continue
                }
                const index = producao.findIndex(p => p.analista === pedido.analista)
                if (index === -1) {

                    const ausenciasUsuario = users.filter(usuario => usuario.name === pedido.analista);
                    const totalFaltas = ausenciasUsuario.length > 0 ? ausenciasUsuario.length : 0;

                    producao.push({
                        analista: pedido.analista,
                        total: 1,
                        indeferidos: pedido.statusGerencial === 'Pagamento Não Realizado' ? 1 : 0,
                        cancelados: pedido.statusGerencial === 'Protocolo Cancelado' ? 1 : 0,
                        aguardandoComprovante: pedido.statusGerencial === 'Aguardando Comprovante' ? 1 : 0,
                        aguardandoRetornoContato: pedido.statusGerencial === 'Aguardando Retorno Contato' ? 1 : 0,
                        comprovanteCorreto: pedido.statusGerencial === 'Comprovante Correto' ? 1 : 0,
                        devolvidoAmil: pedido.statusGerencial === 'Devolvido Amil' ? 1 : 0,
                        pagoPelaAmilSemComprovante: pedido.statusGerencial === 'Pago pela Amil sem Comprovante' ? 1 : 0,
                        faltas: totalFaltas,
                        pacotes: qtdPacoteAnalista[pedido.analista].count
                    })
                } else {
                    producao[index].total += 1
                    producao[index].indeferidos += pedido.statusGerencial === 'Pagamento Não Realizado' ? 1 : 0
                    producao[index].cancelados += pedido.statusGerencial === 'Protocolo Cancelado' ? 1 : 0
                    producao[index].aguardandoComprovante += pedido.statusGerencial === 'Aguardando Comprovante' ? 1 : 0
                    producao[index].aguardandoRetornoContato += pedido.statusGerencial === 'Aguardando Retorno Contato' ? 1 : 0
                    producao[index].comprovanteCorreto += pedido.statusGerencial === 'Comprovante Correto' ? 1 : 0
                    producao[index].devolvidoAmil += pedido.statusGerencial === 'Devolvido Amil' ? 1 : 0
                    producao[index].pagoPelaAmilSemComprovante += pedido.statusGerencial === 'Pago pela Amil sem Comprovante' ? 1 : 0
                }
            }
            return producao.sort((a, b) => b.total - a.total)
        } catch (error) {
            throw error
        }
    }
}