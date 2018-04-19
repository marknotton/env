////////////////////////////////////////////////////////////////////////////////
// Public Functions
////////////////////////////////////////////////////////////////////////////////

'use strict'

const through = require('through2'),
      fs = require('fs'),
      path = require('path')

let cache = null;

module.exports.get = getEnvObject;
module.exports.file = getEnvFile;
module.exports.version = envUpdateVersion;
module.exports.add = addVersionToString;

function addVersionToString(string, version) {
  return string.replace(/(\.[\w\d_-]+)$/i, version+'$1');
}

function envUpdateVersion(type, force) {

  type = type.toUpperCase() + '_VERSION';

  let envContent = getEnvFile();
  let envObj     = getEnvObject();
  let newVersion = 1;

  if (type in envObj) {
    var currentVersion = parseInt(envObj[type].replace(/['"]+/g, ''));
    newVersion = currentVersion + 1;
    envContent = envContent.replace(`${type}="${currentVersion}"`, `${type}="${force || newVersion}"`)
  } else {
    envContent = `${envContent}\n${type}="${force || newVersion}"`;
  }

  try {
    fs.writeFileSync(path.resolve(process.cwd(), '.env'), envContent || '');
  } catch (e) {
    return { error: e }
  }

  return newVersion;

}

function getEnvFile(envPath) {

  envPath = typeof envPath !== 'undefined' ? envPath : '.env';

  try {

    if ( cache == null) {
      let filePath = path.resolve(process.cwd(), envPath);
      console.log(filePath)
      cache = fs.readFileSync(filePath, { encoding : 'utf8'})
    }

    return cache;

  } catch (e) {

    return { error: e }

  }
}

function getEnvObject() {

  try {

    const obj = {}

    // convert Buffers before splitting into lines and processing
    getEnvFile().toString().split('\n').forEach(function (line) {
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

        obj[key] = value
      }
    })

    Object.keys(obj).forEach(function (key) {
      if (!process.env.hasOwnProperty(key)) {
        process.env[key] = obj[key]
      }
    })

    return obj;

  } catch (e) {

    return { error: e }

  }
}
