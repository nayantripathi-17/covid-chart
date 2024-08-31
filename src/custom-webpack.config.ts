import { EnvironmentPlugin } from 'webpack';
const dotEnv = require('dotenv-webpack');

module.exports = {
    plugins: [new dotEnv()],
};
