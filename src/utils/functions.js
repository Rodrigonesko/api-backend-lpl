
module.exports = {
    holidays: [
        '2022-01-01',
        '2022-04-21',
        '2022-05-01',
        '2022-09-07',
        '2022-10-12',
        '2022-11-02',
        '2022-11-15',
        '2022-12-25',
        '2023-01-01',
        '2023-02-20',
        '2023-02-21',
        '2023-02-22',
        '2023-04-07',
        '2023-04-21',
        '2023-05-01',
        '2023-06-08',
        '2023-09-07',
        '2023-10-12',
        '2023-11-02',
        '2023-11-15',
        '2023-12-25',
        '2024-01-01',
        '2024-02-12',
        '2024-02-13',
        '2024-03-29',
        '2024-04-21',
        '2024-05-01',
        '2024-05-30',
        '2024-09-07',
        '2024-10-12',
        '2024-11-02',
        '2024-11-15',
        '2024-11-20',
        '2024-12-25',
    ],

    countWeekdaysInMonth(year, month, holidays = []) {
        let count = 0;
        let date = new Date(year, month, 1);
        while (date.getMonth() === month) {
            if (date.getDay() !== 0 && date.getDay() !== 6) {
                // Dia da semana não é sábado nem domingo
                let dateString = date.toISOString().split('T')[0]; // Formato: 'yyyy-mm-dd'
                if (!holidays.includes(dateString)) {
                    // A data não é um feriado
                    count++;
                }
            }
            date.setDate(date.getDate() + 1);
        }
        return count;
    },

    diasUteisEntreDuasDatas(dataInicio, dataFim, holidays = [], ferias = []) {
        let count = 0;
        if (dataInicio === dataFim) {
            return 1;
        }
        let date = new Date(dataInicio);
        dataFim = new Date(dataFim);
        dataFim.setDate(dataFim.getDate() + 1); // Adicione um dia à data final
        holidays = holidays.concat(ferias);
        holidays = holidays.filter((date, index) => holidays.indexOf(date) === index);



        while (date <= dataFim) { // Use < em vez de <=
            if (date.getDay() !== 0 && date.getDay() !== 6) {
                // Dia da semana não é sábado nem domingo
                let dateString = date.toISOString().split('T')[0]; // Formato: 'yyyy-mm-dd'

                if (!holidays.includes(dateString)) {
                    // A data não é um feriado
                    count++;
                }
            }
            date.setDate(date.getDate() + 1);
        }
        return count;
    }
}