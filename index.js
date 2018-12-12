const Hapi = require('hapi');
const server = new Hapi.Server();

server.connection({port: 8000});

server.start(() => {
	console.log('Running on 8000');
});
