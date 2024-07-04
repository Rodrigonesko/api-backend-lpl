const PropostaEntrevista = require('../models/TeleEntrevista/PropostaEntrevista')

class PropostaEntrevistaService {
    constructor() { }

    async getPropostaById(id) {
        return await PropostaEntrevista.findById(id);
    }

    async getPropostasByStatus(status) {
        return await PropostaEntrevista.find({
            status: { $in: status }
        }).populate('dadosEntrevista');
    }

    async getPropostasByAgendamento(agendado, sort = 'createdAt', pesquisa, responsavel, tipoContrato, limit, page) {

        try {
            const skip = limit * (page - 1);

            console.log(skip, sort);

            const query = {}

            query.status = { $nin: ['Cancelado', 'Concluído'] }

            if (agendado) {
                query.agendado = { $in: ['agendado', 'reagendado'] }
            } else {
                query.agendado = { $nin: ['agendado', 'reagendado'] }
            }

            if (pesquisa) query.$or = [
                { nome: { $regex: pesquisa, $options: 'i' } },
                { cpf: { $regex: pesquisa, $options: 'i' } },
                { proposta: { $regex: pesquisa, $options: 'i' } },
            ]

            if (responsavel) query.enfermeiro = responsavel;
            if (tipoContrato) query.tipoContrato = tipoContrato;

            const [total, propostas, tiposContrato] = await Promise.all([
                PropostaEntrevista.countDocuments(query),
                PropostaEntrevista.find(query).populate('dadosEntrevista').sort({ createdAt: 1 }).limit(limit).skip(skip),
                PropostaEntrevista.distinct('tipoContrato', {
                    status: { $nin: ['Cancelado', 'Concluído'] }
                })
            ]);

            return {
                total,
                propostas,
                tiposContrato
            };
        } catch (error) {
            console.log(error)
            throw new Error('Erro ao buscar propostas', error);
        }
    }

    async getPropostasByEnfermeiro(enfermeiro) {
        return await PropostaEntrevista.find({
            enfermeiro: enfermeiro
        });
    }

    async update(id, data) {
        try {
            return await PropostaEntrevista.findByIdAndUpdate(id, data, {
                new: true
            });
        } catch (error) {
            console.log(error)
            throw new Error('Erro ao atualizar proposta', error);
        }
    }

    async create(data) {
        return await PropostaEntrevista.create(data);
    }

    async delete(id) {
        return await PropostaEntrevista.findByIdAndDelete(id);
    }



}

module.exports = new PropostaEntrevistaService();