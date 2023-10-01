// vitest.config.js

module.exports = {
	files: './tests/**/*.test.js', // Glob pattern for test files
	include: ['./tests/**/*.test.js'], // Include setup.js
	exclude: [
		'**/node_modules/**',
		'**/dist/**',
		'**/.{idea,git,cache,output,temp}/**',
		'**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*'
	],
	watchExclude: ['**/node_modules/**', '**/dist/**']
};
