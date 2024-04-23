const Pedido = require('../models/Rsd/Pedido');
const moment = require('moment');

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
                statusGerencial: 1
            }).lean()

            let producao = []

            let status = [
                'Pagamento Não Realizado',
                'Protocolo Cancelado',
                'Aguardando Comprovante',
                'Aguardando Retorno Contato',
                'Comprovante Correto',
                'Devolvido Amil',
                'Pago pela Amil sem Comprovante',
                'A iniciar'
            ]

            for (const pedido of pedidos) {
                const index = producao.findIndex(p => p.analista === pedido.analista)
                // if (pedido.analista === 'Camila Cristine Remus') {
                //     if (!status.includes(pedido.statusGerencial)) {
                //         console.log(pedido);
                //     }
                // }

                if (index === -1) {
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
                        aIniciar: pedido.statusGerencial === 'A iniciar' ? 1 : 0,
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
                    producao[index].aIniciar += pedido.statusGerencial === 'A iniciar' ? 1 : 0
                }
            }

            // console.log(producao.sort((a, b) => b.total - a.total));

            return producao.sort((a, b) => b.total - a.total)

        } catch (error) {
            throw error
        }
    }
}