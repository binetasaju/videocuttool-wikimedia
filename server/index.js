const { Server } = require('socket.io');
const { createServer } = require('http');
const app = require('./app.js');
const config = require('./config.js');
const socketController = require('./controllers/socket-controller.js');
const User = require('./models/User.js');
const Video = require('./models/Video.js');
const Settings = require('./models/Settings.js');
const { Queue, Worker } = require('bullmq');
const workerProcess = require('./worker.js');
const Redis = require('ioredis');

const { PORT, WORKER_LIMIT } = config();
const server = createServer(app);
const redis = new Redis({
	port: 6379,
	host: 'videocuttool-redis',
	enableReadyCheck: false,
	enableAutoPipelining: false
});

// Listen on the provided port, on all network interfaces
server.listen(PORT);

const io = new Server(server, {
	transports: ['polling', 'websocket'],
	allowEIO3: true
});

app.set('redis', redis);
app.set('socketio', io);

io.sockets.on('connection', socket => {
	console.log('CONNECTED', socket.id);
	app.set('socketid', socket.id);
	socketController(socket, redis);
});

/**
 * Event listener for HTTP server "error" event.
 */
function onError(error) {
	if (error.syscall !== 'listen') {
		throw error;
	}

	const bind = typeof PORT === 'string' ? `Pipe ${PORT}` : `Port ${PORT}`;

	// handle specific listen errors with friendly messages
	switch (error.code) {
		case 'EACCES':
			console.error(`${bind} requires elevated privileges`);
			process.exit(1);
			break;
		case 'EADDRINUSE':
			console.error(`${bind} is already in use`);
			process.exit(1);
			break;
		default:
			throw error;
	}
}

/**
 * Event listener for HTTP server "listening" event.
 */
async function onListening() {
	// The order here is important since Settings depends on Video which
	// depends on User. Using Promise.all(...) will create a race condition
	// where the tables will be created out of order
	await User.sync({ alter: true });
	await Video.sync({ alter: true });
	await Settings.sync({ alter: true });

	// Create the video queue and workers
	const videoQueue = new Queue('videoQueue', {
		connection: {
			host: 'videocuttool-redis',
			port: 6379
		}
	});

	let videoWorkersList = [];
	for (let i = 0; i < WORKER_LIMIT; i++) {
		videoWorkersList.push(
			new Worker(`videoQueue`, workerProcess, {
				connection: {
					host: 'videocuttool-redis',
					port: 6379
				}
			})
		);
	}

	app.set('videoQueue', videoQueue);
	app.set('videoWorkersList', videoWorkersList);

	const addr = server.address();
	const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`;
	console.log(`Listening on ${bind}`);
}

server.on('error', onError);
server.on('listening', onListening);
