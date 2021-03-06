////////////////////////////////////////////////////////////////////////////////
// Env
////////////////////////////////////////////////////////////////////////////////

// =============================================================================
// Settings
// =============================================================================

'use strict'

// Dependencies
const fs      = require('fs'),
      path    = require('path');

// Defaults
let cached = [];

let envFilePath = path.resolve(process.cwd(), '.env');

// Data functions
module.exports.getFile     = getFile;
module.exports.getData     = getData;

// Add / Get functions
module.exports.setVariable = setVariable;
module.exports.getVariable = getVariable;

// =============================================================================
// Get .env file information as a string
// =============================================================================

/**
 * Get the .env file data as a string
 * @param  {string} envPath Add a relative path to the .env file. Defaults to root.
 * @return {string}
 */
function getFile(envPath) {

  envPath = typeof envPath !== 'undefined' && envPath != '' ? envPath : '.env';

  try {

    if ( cached.file == null) {
      envFilePath = path.resolve(process.cwd(), envPath);
      cached.file = fs.readFileSync(envFilePath, { encoding : 'utf8'})
    }

    return cached.file;

  } catch (e) {

    return { error: e }

  }
};

// =============================================================================
// Get .env file data as an object
// =============================================================================

/**
 * Get the .env file as an object
 * @see    https://github.com/motdotla/dotenv/blob/master/lib/main.js
 * @param  {string} request Request a specific variable from the .env file instead of the full object
 * @param  {string} envPath Add a relative path to the .env file. Defaults to root.
 * @return {object | string}
 */
function getData(request, envPath) {
  try {

    if ( cached.data == null) {

      cached.data = [];

      // convert Buffers before splitting into lines and processing
      getFile(envPath).toString().split('\n').forEach(function (line) {
        // matching "KEY' and 'VAL' in 'KEY=VAL'
        const keyValueArr = line.match(/^\s*([\w\.\-]+)\s*=\s*(.*)?\s*$/)
        // matched?
        if (keyValueArr != null) {
          const key = keyValueArr[1]

          // default undefined or missing values to empty string
          let value = keyValueArr[2] || ''

          // expand newlines in quoted values
          const len = value ? value.length : 0
          if (len > 0 && value.charAt(0) === '"' && value.charAt(len - 1) === '"') {
            value = value.replace(/\\n/gm, '\n')
          }

          // remove any surrounding quotes and extra spaces
          value = value.replace(/(^['"]|['"]$)/g, '').trim()

          cached.data[key] = value
        }
      })

      Object.keys(cached.data).forEach(function (key) {
        if (!process.env.hasOwnProperty(key)) {
          process.env[key] = cached.data[key]
        }
      })

    }


    if (typeof request !== 'undefined' && typeof cached.data[request.toUpperCase()] !== 'undefined') {
      return cached.data[request.toUpperCase()];
    }

    return cached.data;

  } catch (e) {

    return { error: e }

  }
};

// =============================================================================
// Get and Add variables
// =============================================================================

/**
 * Set a variable and it's value
 * @param  {string} variable The variable name
 * @param  {mixed}  value    The variable value
 */
function setVariable(variable, value) {

	if ( typeof cached.data === 'undefined' ) {
		getData();
	}

	if ( typeof cached.data[variable] !== 'undefined' ) {

		cached.file = cached.file.replace(`${variable}="${cached.data[variable]}"`, `${variable}="${value}"`)

	} else {

		cached.file = `${cached.file}\n${variable}="${value}"`;

	}

  cached.data[variable] = value;

  try {
    fs.writeFileSync(envFilePath, cached.file || '');
  } catch (e) {
    return { error: e }
  }

};

/**
 * Get a specific variable
 * @param  {string} variable Enter the variable you want to get
 * @return {string}
 */
function getVariable(variable) {

  if ( cached.data == null ) {
    getData();
  }

  if (variable.toUpperCase() in cached.data ) {
    return cached.data[variable.toUpperCase()];
  } else if (variable in cached.data) {
    return cached.data[variable];
  }
};
