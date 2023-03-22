const moment = require('moment')
const ControleAtividade = require('../models/ControleAtividade/ControleAtividade')
const User = require('../models/User/User')

module.exports = {

    /**
 * Atividade padrão iniciada.
 *
 * @route POST /controleAtividade/iniciarPadrao
 * @returns {object} Atividade padrão iniciada.
 * @throws {error} Erro.
 * @param {string} name - Busca o usuário e inicia a atividade padrão dele
 */

    atividadePadrao: async (req, res) => {
        try {
            const { name } = req.body

            const buscarAtividade = await User.findOne({
                name
            })

            const atividadePrincipal = buscarAtividade.atividadePrincipal

            const horarioSaida = buscarAtividade.horarioSaida2

            const find = await ControleAtividade.findOne({
                data: moment().format('YYYY-MM-DD'),
                analista: name
            })

            const diaAnterior = await ControleAtividade.findOne({
                data: { $ne: moment().format('YYYY-MM-DD') },
                analista: name,
                encerrado: false
            })

            if (diaAnterior) {      //Se ele não encerrou a atividade anterior, esse bloco irá fechar sua atividade de acordo com seu horário de saída e fazer o cálculo de quanto tempo ela ficou nesta atividade

                const dataInicio = moment(diaAnterior.horarioInicio)
                const dataFim = moment(`${diaAnterior.data} ${horarioSaida}`)

                let ms = moment(dataFim).diff(moment(dataInicio))
                let d = moment.duration(ms);
                let s = Math.floor(d.asHours()) + moment.utc(ms).format(":mm:ss");

                const encerrar = await ControleAtividade.findByIdAndUpdate({
                    _id: diaAnterior._id
                }, {
                    encerrado: true,
                    horarioFim: moment(dataFim).format('YYYY-MM-DD HH:mm:ss'),
                    totalHoras: s
                })

            }

            //Se ja tem uma atividade em andamento nada acontece

            if (find) {
                return res.status(200).json({
                    msg: 'Dia já iniciado'
                })
            }

            //Inicia atividade baseada na atividade padrão do funcionário

            const create = await ControleAtividade.create({
                analista: name,
                atividade: atividadePrincipal,
                horarioInicio: moment().format('YYYY-MM-DD HH:mm:ss'),
                data: moment().format('YYYY-MM-DD'),
                mes: moment().format('MM/YYYY'),
                encerrado: false
            })

            return res.status(200).json({
                create
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },


    /**
*  Report das atividades em andamento.
*
* @route GET /controleAtividade/andamento
* @returns {object} Report das atividades em andamento.
* @throws {error} Erro.
*/

    atividadesAndamento: async (req, res) => {
        try {

            //Atividade padrões da LPL

            const atividades = [
                'Gerência',
                'Sistemas',
                'Elegibilidade',
                'RSD',
                'Sindicância',
                'Tele Entrevista',
                'Callback',
                'Ti/Infra'
            ]

            let report = []

            //For responsável por verificar quem está fazendo cada atividade

            for (const atividade of atividades) {
                const result = await ControleAtividade.find({
                    data: moment().format('YYYY-MM-DD'),
                    encerrado: false,
                    atividade: atividade
                })

                let analistas = []

                const count = result.length

                result.forEach(item => {
                    analistas.push(item.analista)
                })

                report.push({
                    celula: atividade,
                    quantidade: count,
                    analistas: analistas
                })
            }

            return res.status(200).json({
                report
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    /**
* Atividade do funcionário em andamento.
*
* @route GET /controleAtividade/atual
* @returns {object} Atividade do funcionário em andamento.
* @throws {error} Erro.
*/


    atividadeAtual: async (req, res) => {
        try {

            const atividadeAtual = await ControleAtividade.findOne({
                analista: req.user,
                data: moment().format('YYYY-MM-DD'),
                encerrado: false
            })

            if (atividadeAtual) {
                return res.status(200).json({
                    atividade: atividadeAtual.atividade
                })
            }

            return res.status(200).json({
                atividade: 'Nenhuma'
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    /**
* Assume uma nova atividade.
*
* @route PUT /controleAtividade/assumir
* @returns {object} Assume uma nova atividade.
* @throws {error} Erro.
*/

    assumirAtividade: async (req, res) => {
        try {

            const { atividade } = req.body

            const create = await ControleAtividade.create({
                analista: req.user,
                atividade: atividade,
                horarioInicio: moment().format('YYYY-MM-DD HH:mm:ss'),
                data: moment().format('YYYY-MM-DD'),
                mes: moment().format('MM/YYYY'),
                encerrado: false
            })

            return res.status(200).json({
                create
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },


    /**
 * Encerra a atividade atual.
 *
 * @route PUT /controleAtividade/encerrar
 * @returns {object} Encerra a atividade atual.
 * @throws {error} Erro.
 */

    encerrarAtividade: async (req, res) => {
        try {

            const result = await ControleAtividade.findOne({
                analista: req.user,
                data: moment().format('YYYY-MM-DD'),
                encerrado: false
            })

            const dataInicio = moment(result.horarioInicio)
            const dataFim = moment()

            let ms = moment(dataFim).diff(moment(dataInicio))
            let d = moment.duration(ms);
            let s = Math.floor(d.asHours()) + moment.utc(ms).format(":mm:ss");

            const encerrarAtividade = await ControleAtividade.findByIdAndUpdate({
                _id: result._id
            }, {
                encerrado: true,
                horarioFim: moment(dataFim).format('YYYY-MM-DD HH:mm:ss'),
                totalHoras: s
            })

            return res.status(200).json({
                encerrarAtividade
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    /**
 * Retorna os dados das atividades.
 *
 * @route GET /controleAtividade/report
 * @returns {object} Dados para o excel.
 * @throws {error} Erro.
 */

    report: async (req, res) => {
        try {

            const report = await ControleAtividade.find({
                encerrado: true
            })

            return res.status(200).json({
                report
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    }
}