module.exports = (socket, redis) => {
	socket.on('join', async data => {
		console.log('adds socket id to active connection');

		let currentActiveSockets = JSON.parse(await redis.get('activeSockets')) || {};

		// add socket id to active connection
		currentActiveSockets[data.mediawikiId] = currentActiveSockets[data.mediawikiId] || [];
		currentActiveSockets[data.mediawikiId].push(socket.id);
		console.log(currentActiveSockets);
		// add the active connections to redis
		await redis.set('activeSockets', JSON.stringify(currentActiveSockets));
	});
	socket.on('disconnect', async () => {
		console.log('removes socket id from active connection');

		let currentActiveSockets = JSON.parse(await redis.get('activeSockets')) || {};

		// remove socket id from active connection
		Object.keys(currentActiveSockets).forEach(mediawikiId => {
			currentActiveSockets[mediawikiId] = currentActiveSockets[mediawikiId].filter(
				id => id !== socket.id
			);
		});

		// update the active connections to redis
		await redis.set('activeSockets', JSON.stringify(currentActiveSockets));
	});
};
