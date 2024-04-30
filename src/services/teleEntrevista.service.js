const DadosEntrevista = require('../models/TeleEntrevista/DadosEntrevista');
const vacationRequestService = require('./vacationRequest.service');
const User = require('../models/User/User');
const functions = require('../utils/functions');
const moment = require('moment')
require('moment-business-days')

module.exports = {
    async quantidadeAnalistasPorMes(dataInicio = moment().format('YYYY-MM-DD'), dataFim = moment().format('YYYY-MM-DD')) {
        let result = await DadosEntrevista.aggregate([
            {
                $match: {
                    dataEntrevista: { $gte: dataInicio, $lte: dataFim },
                    responsavel: { $nin: ['Sem Sucesso de Contato!', 'Beneficiario Solicitou o Cancelamento'] },
                }
            },
            {
                $group: {
                    _id: '$responsavel',
                    total: { $sum: 1 },
                    diasTrabalhados: { $addToSet: "$dataEntrevista" }, // Adiciona a data (primeiros 10 caracteres de dataEntrevista) ao conjunto se ainda não estiver presente
                    houveDivergencia: { $sum: { $cond: [{ $eq: ["$houveDivergencia", "Sim"] }, 1, 0] } }
                }
            }
        ])

        let users = await User.aggregate([
            {
                $unwind: "$ausencias"
            }, {
                $match: {
                    "ausencias.data": {
                        $gte: dataInicio,
                        $lte: dataFim
                    }
                }
            }, {
                $project: {
                    ausencias: 1,
                    name: 1,
                    nomeCompleto: 1,
                }
            }
        ]);

        result = await Promise.all(result.map(async item => {
            const user = await User.findOne({ name: item._id }, {
                name: 1,
                nomeCompleto: 1
            }).lean()

            const ausenciasUsuario = users.filter(usuario => usuario.nomeCompleto === user.nomeCompleto);
            const totalFaltas = ausenciasUsuario.length > 0 ? ausenciasUsuario.length : 0;

            const diasDeFerias = await vacationRequestService.vacationDays(user.nomeCompleto)
            const diasUteis = functions.diasUteisEntreDuasDatas(dataInicio, dataFim, functions.holidays, diasDeFerias)
            return ({
                analista: user.nomeCompleto,
                total: item.total,
                media: (item.total / diasUteis),
                houveDivergencia: item.houveDivergencia,
                mediaDivergencia: (item.houveDivergencia / item.total) * 100,
                faltas: totalFaltas,
            })
        }))
        result = result.sort((a, b) => b.total - a.total)
        // console.log(result);
        const media = result.reduce((acc, item) => acc + item.media, 0) / result.length
        const mediaDiasTrabalhados = result.reduce((acc, item) => acc + item.mediaDiasTrabalhados, 0) / result.length
        const mediaTotal = result.reduce((acc, item) => acc + item.total, 0) / result.length
        const faltas = result.reduce((acc, item) => acc + item.faltas, 0) / result.length
        return {
            result,
            media,
            mediaDiasTrabalhados,
            mediaTotal,
            faltas
        }
    }
}