////////////////////////////////////////////////////////////////////////////////
// Settings
////////////////////////////////////////////////////////////////////////////////

'use strict'

const through = require('through2'),
      fs = require('fs'),
      path = require('path')

let cached = [];
let envFilePath = path.resolve(process.cwd(), '.env');

module.exports.updateVersion     = updateVersion;
module.exports.addVariable       = addVariable;
module.exports.getVariable       = getVariable;
module.exports.getVersion        = getVersion;
module.exports.getData           = getData;
module.exports.getFile           = getFile;
module.exports.updateVersionName = updateVersionName;
module.exports.getVersionName    = getVersionName;
module.exports.deleteVersions    = deleteVersions;

////////////////////////////////////////////////////////////////////////////////
// Get .env file information
////////////////////////////////////////////////////////////////////////////////

/**
 * Get the .env file data as a string
 * @param  {string} envPath Add a relative path to the .env file. Defaults to root.
 * @return {string}
 */
function getFile(envPath) {

  envPath = typeof envPath !== 'undefined' ? envPath : '.env';

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

/**
 * Get the .env file as an object
 * @param  {string} envPath Add a relative path to the .env file. Defaults to root.
 * @see https://github.com/motdotla/dotenv/blob/master/lib/main.js
 * @return {object}
 */
function getData(envPath, force) {
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

    return cached.data;

  } catch (e) {

    return { error: e }

  }
};

////////////////////////////////////////////////////////////////////////////////
// Get and Add variables
////////////////////////////////////////////////////////////////////////////////

/**
 * Add a variable and it's value
 * @param  {string} variable The variable name
 * @param  {mixed}  value    The variable value
 */
function addVariable(variable, value) {
  cached.file = `${cached.file}\n${variable}="${value}"`;
};

/**
 * Get a specific variable
 * @param  {[type]} variable Enter the variable you want to get
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

////////////////////////////////////////////////////////////////////////////////
// Version Functions
////////////////////////////////////////////////////////////////////////////////

/**
 * Update the version number of an environment variable
 * @param  {string} type  Choose a prefix to the _VERSION env variable
 * @param  {int} force    By default, this updateVersion function will incriment by one
 *                        each time this functon is called. Hoever, you can update
 *                        a variable to a specific number with force.
 * @return {int}          Returns the new version number.
 */
function updateVersion(variable, force) {

  if ( cached.data == null ) {
    getData();
  }

  let newVersion = 1;
  let currentVersion = getVersion(variable) || undefined;
  let type = variable.toUpperCase() + '_VERSION';

  if (typeof currentVersion !== 'undefined') {
    newVersion = currentVersion + 1;
    cached.file = cached.file.replace(`${type}="${currentVersion}"`, `${type}="${force || newVersion}"`)
  } else {
    addVariable(type, (force || newVersion))
  }

  try {
    fs.writeFileSync(envFilePath, cached.file || '');
  } catch (e) {
    return { error: e }
  }

  cached.data[type] = force || newVersion;

  return newVersion;

};

/**
 * Get the version name of the file without incrementing the version
 * @param  {string} file     [description]
 * @param  {string} variable Define the variable you want to increment.
 *                           If a variable is not defined the file extension will be used
 * @param  {bool} end        If true, the version will be addted just before the file extension
 *                           Otherwise it will be placed before the first fullstip found in the filename
 * @return {string}          Filename with version
 */
function getVersionName(file, variable, end) {

  let extension = file.split('.').pop();

  let version = getVersion((variable || extension)) || '';

  return addVersionToFilename(file, version, end);

}

/**
 * Update the version name of a file
 * @param  {string} file     [description]
 * @param  {string} variable Define the variable you want to increment.
 *                           If a variable is not defined the file extension will be used
 * @param  {bool} end        If true, the version will be addted just before the file extension
 *                           Otherwise it will be placed before the first fullstip found in the filename
 * @return {string}          Filename with version
 */
function updateVersionName(file, variable, end) {

  let extension = file.split('.').pop();

  let version = updateVersion((variable || extension)) || '';

  return addVersionToFilename(file, version, end);

}

/**
 * Do some fancy regex stuff to place the version number within the filename string
 * @param {string} file    filename
 * @param {int}    version the version number you want to add
 * @param {bool}   end     If true, the version will be addted just before the file extension
 *                         Otherwise it will be placed before the first fullstip found in the filename
 */
function addVersionToFilename(file, version, end) {
  if ( typeof version !== 'undefined' ) {
    version = '.v' + version;
    if (typeof end == 'undefined' || end === true) {
      return file.replace(/^([^.]*)(.*)/, '$1'+ version +'$2');
    } else {
      return file.replace(/(\.[\w\d_-]+)$/i, version+'$1');
    }
  } else {
    return file;
  }

}

/**
 * Get version number of a variable
 * @param  {string} variable Only refer to the variable name, you can ommit the _VERSION
 * @return {int}             The variable version number
 */
function getVersion(variable) {
  return parseInt(getVariable(variable.toUpperCase() + '_VERSION'));
};

/**
 * Delete a set amount of versions to avoid large archives
 * @param  {string} file     The Original filename you want to manage. Don't include version number.
 * @param  {string} variable The variable this file versioning refers to
 * @param  {int}    keep   The amount of versions you want to keep
 */
function deleteVersions(fileName, variable, keep) {
  var files = fs.readdirSync(fileName);

  var obj = [];
  console.log(typeof obj);
  files.forEach((file) => {
    var version = file.match(/(?<=\.v)(.*?)(?=\.)/g)[0];
    var clean = file.replace(/(?<=\.)(.*?)(?=\.)/, '').replace('..', '.');

    if ( typeof version !== 'undefined') {
      // obj.clean.version = file;

      if (clean in obj) {
        // obj[clean] = {version};
        obj[clean] = obj[clean] +', '+ version
      } else {
        obj[clean] = []
        // obj[clean] = {ver : version};
        // obj[clean] = version;
      }
    }
  });
  console.log(obj);

  //
  // var fileToDelete = 'public/assets/js/main.min10.js';
  // TODO: Get all files that share the name despite the versiob
  // TODO: Add all deleatble files in an array
  // TODO Loop through the array with this function:
  // fs.unlinkSync(fileToDelete);
};
