const PlanosPF = require("../models/Rsd/PlanosPF");
const fs = require('fs')

class PlanoPfService {

    constructor() { }

    async createPlanoPf(data) {
        return await PlanosPF.create(data);
    }

    async getPlanosPf() {
        return await PlanosPF.find();
    }

    async getPlanoByData(data) {
        if (Object.keys(data).length === 0) return false
        console.log(data);
        const plano = await PlanosPF.findOne({
            nome: data.nome,
            codigo: data.codigo
        }).lean();
        if (!plano) return false
        if (plano.prazo === '90 dias') {
            return plano
        }
        return await PlanosPF.findOne(data).lean();
    }

    // async uploadingPlanosPf() {

    //     const file = fs.readFileSync('./src/services/planos.csv', 'utf8');

    //     const lines = file.split('\n');
    //     for (const line of lines) {
    //         const [nome, porte, dataVigencia, ano, codigo] = line.split(';');
    //         await PlanosPF.create({ nome, dataVigencia, codigo, prazo: '30 dias'});
    //         console.log(nome, dataVigencia, codigo);
    //     }

    //     return lines;
    // }
}

module.exports = new PlanoPfService();