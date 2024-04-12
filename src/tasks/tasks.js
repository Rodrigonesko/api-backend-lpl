const cron = require('node-cron');
const moment = require('moment');
const avaliacoesService = require('../services/avaliacaoPerformanceIndividual.service');

cron.schedule('0 8 * * 1', async () => {

    const dataInicio = moment().subtract(1, 'weeks').startOf('isoWeek').format('YYYY-MM-DD');
    const dataFim = moment().subtract(1, 'weeks').endOf('isoWeek').format('YYYY-MM-DD');

    console.log(dataInicio, dataFim);

    await avaliacoesService.rendimentoTodasCelulas(dataInicio, dataFim);

}, {
    timezone: 'America/Sao_Paulo'
});

// Para executar primeiro dia do mês às 8h

cron.schedule('0 8 1 * *', async () => {
    
    const dataInicio = moment().subtract(1, 'months').startOf('month').format('YYYY-MM-DD');
    const dataFim = moment().subtract(1, 'months').endOf('month').format('YYYY-MM-DD');

    console.log(dataInicio, dataFim);

    await avaliacoesService.rendimentoTodasCelulas(dataInicio, dataFim);

}, {
    timezone: 'America/Sao_Paulo'
});

// cron.schedule('30 * * * * *', () => {
//     // Sua lógica aqui
//     console.log('Esta função é executada no segundo 30 de cada minuto.');
// });