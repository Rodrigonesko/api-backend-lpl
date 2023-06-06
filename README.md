# Backend para o sistema da LPL

<p align="center">
    O Backend da lpl utiliza Node.js, Express e MongoDB para realizar as operações necessárias
</p>
<p align="center">
 <a href="#instalacao">Instalação</a> •
 <a href="#configuracao">Configuraçãp</a> • 
 <a href="#uso">Uso</a> • 
 <a href="#rotas">Rotas</a> • 
 <a href="#contribuicao">Contribuição</a> • 
 <a href="#testes">Testes</a> • 
 <a href="#licenca">Licença</a> • 
 <a href="#contato">Contato</a> • 
</p>

<h4 align="center"> 
	Instalação
</h4>
<p align="center">
    Certifique-se de ter o Node.js e o MongoDB instalados em sua máquina
    <p>
        Clone este repositório:
    </p>
        <p>
        git clone https://github.com/Rodrigonesko/api-backend-lpl.git
    </p>
    <p>
        Acesse o diretório do projeto:
        <p>
        cd api-exemplo
        </p>
    </p>
    <p>
        Instale as dependências:
        <p>
        npm install
        </p>
    </p>
</p>

<h4 align="center" id='configuracao'> 
	Configuração
</h4>

<p>
    Antes de executar a API, você precisa configurar as variáveis de ambiente. Crie o arquivo .env com as seguintes variáveis
</p>
<p>
    SERVER_PORT -> Define a porta onde a api irá ser executada
</p>
<p>
    MONGODB_URL -> URL do seu mongodb, exemplo: mongodb://localhost:27017
</p>
<p>
    JWT_SECRET -> código jwt para autenticação de requisição
</p>
<p>
FRONT_END_ADDRESS -> Endereço onde ficará seu front end
</p>
<p>
API_TELE -> Api das tele entrevistas
</p>
<p>
TWILIO_ACCOUNT_SID -> Sid da sua conta Twilio
</p>
<p>
TWILIO_AUTH_TOKEN -> Token de autenticação da Twilio
</p>
<p>
TWILIO_NUMBER -> Número que será usado para mandar mensagens pelo whatsapp
</p>


<h4 align="center" id='uso'> 
	Uso
</h4>

<p>
Para iniciar a API, execute o seguinte comando:
</p>
<p>
npm start
</p>
<p>
A API estará disponível em http://localhost:SERVER_PORT.
</p>
