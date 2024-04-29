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
        return await PlanosPF.findOne(data);
    }

    // async uploadingPlanosPf() {

    //     const file = fs.readFileSync('./src/services/planos_pf.csv', 'utf8');

    //     const lines = file.split('\n');
    //     for (const line of lines) {
    //         const [nome, dataVigencia, ano, codigo] = line.split(';');
    //         await PlanosPF.create({ nome, dataVigencia, codigo });
    //         console.log(nome, dataVigencia, codigo);
    //     }

    //     return lines;
    // }
}

module.exports = new PlanoPfService();