const Pedido = require('../models/Rsd/Pedido');
const moment = require('moment');

module.exports = {
    producaoIndividualRsd: async (dataInicio = moment().format('YYYY-MM-DD'), dataFim = moment().format("YYYY-MM-DD")) => {
        try {

            const statusPadraoAmil = [
                'INDEFERIR - Em contato beneficiário confirma que não realizou pagamento',
                'INDEFERIR - Em contato beneficiário foi confirmado fracionamento de Nota Fiscal'
            ]

            const pedidos = await Pedido.find({
                dataConclusao: {
                    $gte: dataInicio,
                    $lte: dataFim
                }
            }, {
                analista: 1,
                statusPadraoAmil: 1,
                statusGerencial: 1
            }).lean()

            let producao = [{
                analista: '',
                total: 0,
                indeferidos: 0,
                cancelados: 0
            }]

            for (const pedido of pedidos) {
                const index = producao.findIndex(p => p.analista === pedido.analista)

                if (index === -1) {
                    producao.push({
                        analista: pedido.analista,
                        total: 1,
                        indeferidos: statusPadraoAmil.includes(pedido.statusPadraoAmil) ? 1 : 0,
                        cancelados: pedido.statusGerencial === 'Protocolo Cancelado' ? 1 : 0,
                    })
                } else {
                    producao[index].total += 1
                    producao[index].indeferidos += statusPadraoAmil.includes(pedido.statusPadraoAmil) ? 1 : 0
                    producao[index].cancelados += pedido.statusGerencial === 'Protocolo Cancelado' ? 1 : 0
                }
            }

            return producao.sort((a, b) => b.total - a.total)

        } catch (error) {
            throw error
        }
    }
}