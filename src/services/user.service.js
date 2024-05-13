const User = require("../models/User/User");

class UserService {
    constructor() { }

    async getUsersFaltasByDate(dataInicio, dataFim) {
        return await User.aggregate([
            {
                $unwind: "$ausencias"
            },
            {
                $match: {
                    "ausencias.data": {
                        $gte: dataInicio,
                        $lte: dataFim
                    }
                }
            },
            {
                $project: {
                    ausencias: 1,
                    name: 1,
                    nomeCompleto: 1
                }
            }
        ]);
    }

    async getUsersAtivosByAtividadePrincipal(atividadePrincipal) {
        return await User.find({
            atividadePrincipal: atividadePrincipal,
            inativo: { $ne: true }
        });
    }
}

module.exports = new UserService();