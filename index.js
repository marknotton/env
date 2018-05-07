////////////////////////////////////////////////////////////////////////////////
// Settings
////////////////////////////////////////////////////////////////////////////////

'use strict'

// Dependencies
const fs = require('fs'),
      path = require('path'),
      log = require('fancy-log'),
      chalk = require('chalk')

// Defaults
let cached = [];
let defaultKeep = 5;
let envFilePath = path.resolve(process.cwd(), '.env');

// Data functions
module.exports.getFile           = getFile;
module.exports.getData           = getData;

// Add / Get functions
module.exports.setVariable       = setVariable;
module.exports.getVariable       = getVariable;

// Version functions
module.exports.getVersion        = getVersion;
module.exports.updateVersion     = updateVersion;
module.exports.updateVersionName = updateVersionName;
module.exports.getVersionName    = getVersionName;
module.exports.deleteVersions    = deleteVersions;
module.exports.manage            = manage;

////////////////////////////////////////////////////////////////////////////////
// Get .env file information
////////////////////////////////////////////////////////////////////////////////

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

////////////////////////////////////////////////////////////////////////////////
// Get and Add variables
////////////////////////////////////////////////////////////////////////////////

/**
 * Set a variable and it's value
 * @param  {string} variable The variable name
 * @param  {mixed}  value    The variable value
 */
function setVariable(variable, value) {

  cached.file = `${cached.file}\n${variable}="${value}"`;
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

////////////////////////////////////////////////////////////////////////////////
// Version Functions
////////////////////////////////////////////////////////////////////////////////

/**
 * Get version number of a variable
 * @param  {string} variable Only refer to the variable name, you can ommit the _VERSION
 * @return {int}             The variable version number
 */
function getVersion(variable) {
  return parseInt(getVariable(variable.toUpperCase() + '_VERSION'));
};


/**
 * Update the version number of an environment variable
 * @param  {string} type  Choose a variable name that is prefixed to _VERSION
 * @param  {int}    force By default, this function will incriment versions by one
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
    cached.file = `${cached.file}\n${type}="${force || newVersion}"`;
  }

  cached.data[type] = force || newVersion;

  try {
    fs.writeFileSync(envFilePath, cached.file || '');
  } catch (e) {
    return { error: e }
  }

  return newVersion;

};

/**
 * Get the version name of the file without incrementing the version
 * @param  {string} file     [description]
 * @param  {string} variable Define the variable you want to increment.
 *                           If a variable is not defined the file extension will be used
 * @param  {bool}   end      If true, the version will be addted just before the file extension
 *                           Otherwise it will be placed before the first fullstip found in the filename
 * @return {string}          Filename with version
 */
function getVersionName(file, variable, end) {

  let extension = file.split('.').pop();

  let version = getVersion((variable || extension)) || '';

  return _addVersionToFilename(file, version, end);

}

/**
 * Update the version name of a file
 * @param  {string} file     [description]
 * @param  {string} variable Define the variable you want to increment.
 *                           If a variable is not defined the file extension will be used
 * @param  {bool}   end      If true, the version will be addted just before the file extension
 *                           Otherwise it will be placed before the first fullstip found in the filename
 * @return {string}          Filename with version
 */
function updateVersionName(file, variable, end) {

  let extension = file.split('.').pop();

  let version = updateVersion((variable || extension)) || '';

  return _addVersionToFilename(file, version, end);

}

/**
 * Delete a set amount of versionsed files.
 * @param  {string} directory The Original filename you want to manage. Don't include the version number.
 * @param  {string} original  Pass the original filename so the comparison can match files after the version number has be verified
 * @param  {int}    keep      The amount of versions you want to keep
 * @return {array}  Returns an array of the files that were deleted
 */
function deleteVersions(directory, original, keep) {

  if ( directory === 'undefined') {
    console.warn('You must provide the directory path to look for your versioned files');
    return [];
  }

  if ( original === 'undefined') {
    console.warn('You must provide the original filename so that a comparison can be made before deleting files in ' + directory);
    return [];
  }

  const files = fs.readdirSync(directory);
  var keep = typeof keep !== 'undefined' ? keep : defaultKeep;
  var obj = [];
  var deleted = [];

  if ( files.length ) {

    files.forEach((file) => {
      var version = parseInt(file.match(/(?<=\.v)(.*?)(?=\.)/g));
      var clean = file.replace(/(?<=\.)(.*?)(?=\.)/, '').replace('..', '.');
      if ( typeof version !== 'undefined' && !isNaN(version)) {
        if (clean == original && clean in obj) {
          obj[clean].push(version);
        } else {
          obj[clean] = [version];
        }
      }
    });

    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        var versions = obj[key].sort((a, b) => a - b).slice(0, -(keep-1));
        for (var version in versions) {
          var deleteFile = directory + key.replace(/^([^.]*)(.*)/, '$1'+ '.v' +versions[version] +'$2');
          deleted.push(deleteFile);
          try {
            log(`${chalk.hex('#BB6475')("Deleting:")} ${chalk.redBright(deleteFile)}`);
          } catch(e) {
            console.log("Deleting: " + deleteFile);
          }

          fs.unlinkSync(deleteFile);
        }
      }
    }
  }

  return deleted;

};

/**
 * Combines and managines a range of version controlled taks.
 * Includes a loop detection so avoid gulp watchers triggering on every set of task runs.
 * Deletes old versions and manages name verioning.
 * @param  {string}  directory    The Original filename you want to manage. Don't include the version number.
 * @param  {string}  original     Pass the original filename so the comparison can match files after the version number has be verified
 * @param  {string}  variable     Define the variable you want to increment.
 * @param  {Boolean} increment    Define if the version name should be incremented or not
 * @param  {int}     keep         The amount of versions you want to keep
 * @return {string}               Final version name. Returns original if there was an error.
 */
var loopers = [];
function manage() {

  if ( typeof arguments[0] == 'object') {
    // Destructure arguemnts. An associative object is checked first.
    var { directory, original, variable, increment = true, keep = defaultKeep } = arguments[0];
  } else {
    // Otherwise apply the arguments in this order to these variables.
    var [ directory, original, variable, increment = true, keep = defaultKeep ] = arguments;
  }

  let filename = original;

  try {

    if (!loopers.includes(original)) {

      loopers.push(original);

      filename = increment ? this.updateVersionName(original, variable) : this.getVersionName(original, variable);

      this.deleteVersions(directory, original);

    } else {

      filename = this.getVersionName(original, variable);
    }
  } catch (e) {

  }

  return filename;

}

////////////////////////////////////////////////////////////////////////////////
// Private functions
////////////////////////////////////////////////////////////////////////////////

/**
 * Do some fancy regex stuff to place the version number within the filename string
 * @param {string} file    filename
 * @param {int}    version the version number you want to add
 * @param {bool}   end     If true, the version will be addted just before the file extension
 *                         Otherwise it will be placed before the first fullstip found in the filename
 */
function _addVersionToFilename(file, version, end) {
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
