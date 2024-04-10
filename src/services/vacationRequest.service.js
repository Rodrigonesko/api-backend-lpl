const VacationRequest = require('../models/Ferias/VacationRequest');
const moment = require('moment')

module.exports = {
    async vacationDays(colaborador) {
        const vacationRequest = await VacationRequest.find({
            colaborador: colaborador,
        });

        const vacationDates = vacationRequest.flatMap(vacation => {
            let inicio = moment(vacation.dataInicio);
            const fim = moment(vacation.dataRetorno.split('/').reverse().join('-'));
            const dates = [];

            while (inicio.isSameOrBefore(fim)) {
                dates.push(inicio.format('YYYY-MM-DD'));
                inicio = inicio.add(1, 'days');
            }

            return dates;
        });

        return vacationDates;
    }
}