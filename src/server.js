require('dotenv').config()
const app = require('./app')
const serverPort = process.env.SERVER_PORT

app.listen(serverPort, ()=>{
    console.log(`Server rodando na porta ${serverPort}`);
})