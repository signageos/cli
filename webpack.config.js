const fs = require('fs');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackInlineSourcePlugin = require('html-webpack-inline-source-plugin');
const SosRestApi = require('@signageos/sdk/dist/RestApi/RestApi');

exports = module.exports = {
	entry: "./src/index.js",
	output: {
		filename: 'index.js',
	},
	resolve: {
		extensions: [".js"],
	},
	module: {
		rules: [
			{
				test: /^(.(?!.module.css))*.css$/,
				use: ['style-loader', 'css-loader'],
			},
		],
	},
	plugins: [
			new HtmlWebpackPlugin({
				template: 'public/index.html',
				inlineSource: '.(js|css)$', // embed all javascript and css inline
			}),
			new HtmlWebpackInlineSourcePlugin(),
			{ apply: async (compiler) => {
				const sos = new SosRestApi({
					url: process.env.SOS_API_URL,
					version: 'v1',
					auth: {
						clientId: process.env.SOS_AUTH_CLIENT_ID,
						secret: process.env.SOS_AUTH_SECRET,
					},
				});
				const packageConfig = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json')).toString());
				const applet = await sos.applet.get(packageConfig.sos.uid);
				const appletVersion = await sos.appletVersion.get(applet.uid, packageConfig.version);

				compiler.plugin('done', async (stats) => {
					const indexHtml = stats.compilation.assets['index.html'].source();
					const frontAppletPackageConfigPath = require.resolve('@signageos/front-applet/package.json');
					const frontAppletPackageConfig = JSON.parse(fs.readFileSync(frontAppletPackageConfigPath).toString());
					const frontAppletVersion = frontAppletPackageConfig.version;
					await sos.appletVersion.update(appletVersion.appletUid, appletVersion.version, {
						binary: indexHtml,
						frontAppletVersion,
					});
				});
			} },
	],
};
