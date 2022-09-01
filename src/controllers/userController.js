const mongoose = require('mongoose')
const User = mongoose.model('User')
const bcrypt = require('bcrypt')

module.exports = {
    create: async (req, res)=>{
        try {

            const {email, name, password, confirmPassword, accessLevel} = req.body

            const user = await User.findOne({email})

            if(user){
                return res.status(422).json({message: `O email ${email} ja foi registrado`})
            }

            if(password !== confirmPassword){
                return res.status(401).json({message: `As senhas não conferem`})
            }

            const encryptedPassword = await bcrypt.hash(password, 8)

            const newUser = await User.create({
                email,
                name,
                password: encryptedPassword,
                accessLevel
            })

            return res.status(201).json(newUser)

        } catch (error) {
            console.error(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    }
}