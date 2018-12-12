const Http = require('http');
const Hapi = require('hapi');

if (process.env.SERVER === 'http') {
	const app = new Http.Server();

	app.on('request', (req, res) => {
		res.writeHead(404, { 'Content-Type': 'text/plain' });
		res.write('Not Found');
		res.end('\n');
	});

	app.listen(8000, () => {
		console.log(`http running on port 8000`);
	});
} else {
	const server = new Hapi.Server();

	server.connection({port: 8000});

	server.start(() => {
		console.log('hapi running on 8000');
	});
}
