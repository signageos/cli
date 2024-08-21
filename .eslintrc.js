module.exports = {
	...require('@signageos/codestyle/.eslintrc.js'),
	ignorePatterns: [
		'**/*.json',
		'node_modules/',
		'package.json',
		'package-lock.json',
		'README.md',
		'CHANGELOG.md',
		'.prettierignore',
		'docker-compose.yml',
	],
};
