const cron = require('node-cron');
const moment = require('moment');
const avaliacoesService = require('../services/avaliacaoPerformanceIndividual.service');
const sindicanciaService = require('../services/sindicancia.service');

avaliacoesService.rendimentoTodasCelulas('2024-01-01', '2024-10-17');

// const rsdService = require('../services/rsd.service');
// const teleEntrevistaService = require('../services/teleEntrevista.service');
// const elegibilidadePmeService = require('../services/elegibilidadePme.service');

cron.schedule('0 8 * * 1', async () => {
    const dataInicio = moment().subtract(1, 'weeks').startOf('isoWeek').format('YYYY-MM-DD');
    const dataFim = moment().subtract(1, 'weeks').endOf('isoWeek').format('YYYY-MM-DD');
    await avaliacoesService.rendimentoTodasCelulas(dataInicio, dataFim);
}, {
    timezone: 'America/Sao_Paulo'
});

// Para executar primeiro dia do mês às 8h

cron.schedule('0 8 1 * *', async () => {
    const dataInicio = moment().subtract(1, 'months').startOf('month').format('YYYY-MM-DD');
    const dataFim = moment().subtract(1, 'months').endOf('month').format('YYYY-MM-DD');
    await avaliacoesService.rendimentoTodasCelulas(dataInicio, dataFim);
}, {
    timezone: 'America/Sao_Paulo'
});


cron.schedule('0 0 * * *', async () => {
    await sindicanciaService.conferirDatasBradesco();
}, {
    timezone: 'America/Sao_Paulo'
})
// cron.schedule('30 * * * * *', () => {
//     // Sua lógica aqui
//     console.log('Esta função é executada no segundo 30 de cada minuto.');
// });