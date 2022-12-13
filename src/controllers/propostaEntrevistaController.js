const mongoose = require('mongoose')
const PropostaEntrevista = mongoose.model('PropostaEntrevista')
const Horario = mongoose.model('Horario')
const moment = require('moment')
const momentBusiness = require('moment-business-days')

module.exports = {
    upload: async (req, res) => {

        try {
            const { result } = req.body

            let quantidade = 0

            for (const item of result) {

                const proposta = item.NUM_PROPOSTA

                let vigencia = ExcelDateToJSDate(item.DT_VENDA)
                vigencia.setDate(vigencia.getDate() + 1)
                vigencia = moment(vigencia).format('YYYY-MM-DD')

                console.log(vigencia);

                const filial = item.FILIAL

                const riscoBeneficiario = item.RISCO_BENEF

                const riscoImc = item.RISCO_IMC

                const sinistral = item.SINISTRALIDADE_ANT

                const liminar = item.LIMINAR_ANT

                const fraude = item.FRAUDE_ANT

                const propCancel = item.PROP_CANCEL_UNDER_ANT

                const sinistContr = item.SINIST_CONTR_ANT

                const corretora = item.CORRETORA

                const corretor = item.CORRETOR

                const cpf = item.NUM_CPF

                const nome = item.NOME_ASSOCIADO

                const sexo = item.SEXO

                const tipoAssociado = item.TIPO_ASSOCIADO

                const tipoContrato = item.TIPO_CONTRATO

                if (tipoContrato !== 'Coletivo por Adesão com Administradora') {
                    vigencia = moment().businessAdd(2).format('DD/MM/YYYY')
                }

                const grupoCarencia = item.GRUPO_CARENCIA

                const d1 = item.DS_1
                const d2 = item.DS_2
                const d3 = item.DS_3
                const d4 = item.DS_4
                const d5 = item.DS_5
                const d6 = item.DS_6
                const d7 = item.DS_7
                const d8 = item.DS_8
                const d9 = item.DS_9

                const peso = item.PESO
                const altura = item.ALTURA
                const imc = item.IMC

                const cid1 = item.CID_PI_ANT_1
                const cid2 = item.CID_PI_ANT_2
                const cid3 = item.CID_PI_ANT_3

                const observacao = item['OBSERVAÇÕES']
                const ddd = item.NUM_DDD_CEL
                const numero = item.NUM_CEL
                const telefone = `(${ddd}) ${numero}`

                let dataNascimento

                if (typeof (item.DT_NASC) === 'number') {
                    dataNascimento = ExcelDateToJSDate(item.DT_NASC)
                    dataNascimento.setDate(dataNascimento.getDate() + 1)
                    dataNascimento = moment(dataNascimento).format('DD/MM/YYYY')
                    idade = calcularIdade(dataNascimento)
                } else {
                    dataNascimento = item.DT_NASC
                    idade = calcularIdade(dataNascimento)
                }

                let formulario

                if (idade <= 2) {
                    formulario = '0-2 anos'
                }

                if (idade >= 3 && idade <= 8) {
                    formulario = '2-8 anos'
                }

                if (idade >= 9) {
                    formulario = 'adulto'
                }

                console.log(formulario);

                const resultado = {
                    dataRecebimento: moment(new Date()).format('YYYY-MM-DD'),
                    proposta,
                    filial,
                    riscoBeneficiario,
                    riscoImc,
                    sinistral,
                    liminar,
                    fraude,
                    propCancel,
                    sinistContr,
                    corretora,
                    corretor,
                    cpf,
                    nome,
                    sexo,
                    dataNascimento,
                    idade,
                    d1,
                    d2,
                    d3,
                    d4,
                    d5,
                    d6,
                    d7,
                    d8,
                    d9,
                    observacao,
                    vigencia,
                    telefone,
                    grupoCarencia,
                    peso,
                    altura,
                    imc,
                    cid1,
                    cid2,
                    cid3,
                    tipoAssociado,
                    tipoContrato,
                    formulario
                }

                const existeProposta = await PropostaEntrevista.findOne({
                    proposta,
                    nome
                })


                if (!existeProposta) {
                    const newPropostaEntrevista = await PropostaEntrevista.create(resultado)
                    quantidade++
                }

            }

            return res.status(200).json({ message: `Foram inseridas ${quantidade} novas propostas!` })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }

    },
    show: async (req, res) => {
        try {
            const propostas = await PropostaEntrevista.find().sort('vigencia')

            return res.status(200).json({
                propostas
            })

        } catch (error) {
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    mostrarPropostasAgendadas: async (req, res) => {
        try {
            const propostas = await PropostaEntrevista.find({
                $and: [
                    { agendado: 'agendado' },
                    { status: { $ne: 'Concluído' } },
                    { status: { $ne: 'Cancelado' } }
                ]
            }).sort('dataEntrevista')

            console.log(propostas);

            return res.status(200).json({
                propostas
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    mostrarPropostasNaoAgendadas: async (req, res) => {
        try {
            const propostas = await PropostaEntrevista.find({
                $and: [
                    { agendado: {$ne: 'Agendado'} },
                    { status: { $ne: 'Concluído' } },
                    { status: { $ne: 'Cancelado' } }
                ]
            }).sort('vigencia')

            return res.status(200).json({
                propostas,
                total: propostas.length
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

}

function ExcelDateToJSDate(serial) {
    var utc_days = Math.floor(serial - 25569);
    var utc_value = utc_days * 86400;
    var date_info = new Date(utc_value * 1000);

    var fractional_day = serial - Math.floor(serial) + 0.0000001;

    var total_seconds = Math.floor(86400 * fractional_day);

    var seconds = total_seconds % 60;

    total_seconds -= seconds;

    var hours = Math.floor(total_seconds / (60 * 60));
    var minutes = Math.floor(total_seconds / 60) % 60;

    return new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate(), hours, minutes, seconds);
}

function calcularIdade(data) {
    var now = new Date();
    var today = new Date(now.getYear(), now.getMonth(), now.getDate());

    var yearNow = now.getYear();
    var monthNow = now.getMonth();
    var dateNow = now.getDate();
    var dob = new Date(data.substring(6, 10),
        data.substring(3, 5) - 1,
        data.substring(0, 2)
    );

    var yearDob = dob.getYear();
    var monthDob = dob.getMonth();
    var dateDob = dob.getDate();
    var age = {};
    yearAge = yearNow - yearDob;

    if (monthNow >= monthDob)
        var monthAge = monthNow - monthDob;
    else {
        yearAge--;
        var monthAge = 12 + monthNow - monthDob;
    }

    if (dateNow >= dateDob)
        var dateAge = dateNow - dateDob;
    else {
        monthAge--;
        var dateAge = 31 + dateNow - dateDob;

        if (monthAge < 0) {
            monthAge = 11;
            yearAge--;
        }
    }

    age = {
        years: yearAge,
        months: monthAge,
        days: dateAge
    };
    return age.years;
}