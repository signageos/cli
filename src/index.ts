#!/usr/bin/env node

import * as Debug from 'debug';
const debug = Debug('@signageos/cli:index');

const parameters = require('../config/parameters');

debug('API URL', parameters.apiUrl);
