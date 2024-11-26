const DadosEntrevista = require('../models/TeleEntrevista/DadosEntrevista');
const PropostaEntrevista = require('../models/TeleEntrevista/PropostaEntrevista');

class CancelarEntrevistaUsecase {
    async execute(id, motivo, responsavel) {
        try {
            const dadosEntrevista = await DadosEntrevista.create({
                idProposta: id,
                cancelado: true,
                divergencia: motivo,
                houveDivergencia: 'Não'
            })
            const proposta = await PropostaEntrevista.findOneAndUpdate({
                _id: id
            }, {
                status: 'Cancelado',
                motivoCancelamento: motivo,
                enfermeiro: responsavel,
                newStatus: 'Cancelado',
                dadosEntrevista: dadosEntrevista._id
            })

            await DadosEntrevista.updateOne({
                _id: dadosEntrevista._id
            }, {
                tipoFormulario: proposta.formulario,
                proposta: proposta.proposta,
                nome: proposta.nome,
                dataNascimento: proposta.dataNascimento,
                tipoContrato: proposta.tipoContrato,
                sexo: proposta.sexo,
                idade: proposta.idade,
                vigencia: proposta.vigencia,
                dataRecebimento: proposta.dataRecebimento,
                filial: proposta.filial,
                administradora: proposta.administradora,
                cpf: proposta.cpf,
            })

            return dadosEntrevista
        } catch (error) {
            console.error('Erro ao cancelar entrevista:', error);
            throw new Error('Erro ao cancelar entrevista:', error);
        }
    }
}

module.exports = new CancelarEntrevistaUsecase();