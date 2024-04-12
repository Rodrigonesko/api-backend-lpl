const moment = require("moment")
const elegibilidadeService = require("../services/elegibilidade.service")
const elegibilidadePmeService = require("../services/elegibilidadePme.service")
const rsdService = require("../services/rsd.service")
const teleEntrevistaService = require("../services/teleEntrevista.service")
const sindicanciaService = require("../services/sindicancia.service")

module.exports = {

}

const rendimentoTodasCelulas = async (dataInicio = moment().format('YYYY-MM-DD'), dataFim = moment().format("YYYY-MM-DD")) => {

    const producaoElegibilidadePme = await elegibilidadePmeService.producaoIndividualElegibilidadePme(dataInicio, dataFim)
    console.log(producaoElegibilidadePme);
    const producaoElegibilidade = await elegibilidadeService.producaoIndividualElegibilidade(dataInicio, dataFim)
    console.log(producaoElegibilidade);
    const producaoRsd = await rsdService.producaoIndividualRsd(dataInicio, dataFim)
    console.log(producaoRsd);
    const producaoTeleEntrevista = await teleEntrevistaService.quantidadeAnalistasPorMes(dataInicio, dataFim)
    console.log(producaoTeleEntrevista);
    const producaoSindicancia = await sindicanciaService.producaoAnalistasByDate(dataInicio, dataFim)
    console.log(producaoSindicancia);
}

rendimentoTodasCelulas()