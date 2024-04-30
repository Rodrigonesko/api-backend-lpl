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
}

module.exports = new UserService();