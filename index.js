const fs   = require('fs')
const path = require('path')

class Env {

  data = {}
  fileContents = ''
  envFilePath = ''

  constructor(envPath = '.env') {

    try {
      // Get the contents of the .env file and store it as a string file
      this.envFilePath = path.resolve(process.cwd(), envPath);

      if (!fs.existsSync(this.envFilePath)) {
        fs.writeFileSync(this.envFilePath, '');
      }
  
      this.fileContents = fs.readFileSync(this.envFilePath, { encoding : 'utf8'}).toString()

      // convert Buffers before splitting into lines and processing
      this.fileContents.split('\n').forEach(line => {

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

          this.data[key] = value
        }
      })
      return;

    } catch (e) {
      return { error: e }
    }
  }

  /**
   * Set a variable and it's value
   * @param  {string} variable The variable name
   * @param  {string | number | boolean | null} value    The variable value
   */
  set(variable, value) {

    if (typeof(value) == 'undefined') {
      value = ''
    }

    variable = variable.toUpperCase()

    if ( typeof this.data[variable] !== 'undefined' ) {

      this.fileContents = this.fileContents.replace(`${variable}="${this.data[variable]}"`, `${variable}="${value}"`)

    } else {

      this.fileContents = `${this.fileContents}\n${variable}="${value}"`;

    }

    this.data[variable] = value;

    try {
      fs.writeFileSync(this.envFilePath, this.fileContents || '');
      return;
    } catch (e) {
      return { error: e }
    }

  }

/**
 * Delete a specific variable
 * @param {string} variable Enter the variable you want to delete
 */
  delete(variable) {

    variable = variable.toUpperCase();

    let lineNumber = null;

    const lines = this.fileContents.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith(variable + '=')) {
        lineNumber = i;
      }
    }

    if (lineNumber !== null) {
      const lines = this.fileContents.split(/\r?\n/);
      lines.splice(lineNumber, 1);
      this.fileContents = lines.join('\n');
    }

    try {
      // If the file is now empty, delete it. Otherwise, write the updated contents.
      if (this.fileContents.trim() === '') {
        fs.unlinkSync(this.envFilePath);
      } else {
        fs.writeFileSync(this.envFilePath, this.fileContents || '');
      }
      return;
    } catch (e) {
      return { error: e }
    }

  }

  /**
   * Add a 'true' boolean value to the given vairable, or remove it entirely. 
   * @param {string} variable Enter the variable you want to toggle 
   * @param {boolean} boolean 
   */
  toggleBoolean(variable, boolean) {
    if ( boolean ) {
      this.set(variable, true)
    } else {
      this.delete(variable)
    }
  }

  /**
   * Get a specific variable
   * @param  {string} variable Enter the variable you want to get
   * @return {string | undefined}
   */
  get(variable) {
    if (variable.toUpperCase() in this.data ) {
      return this.data[variable.toUpperCase()];
    } else if (variable in this.data) {
      return this.data[variable];
    }
    return undefined;
  }

  /**
   * Check is a specific property exists
   * @param  {string} variable Enter the variable you want to check
   * @return {string}
   */
  has(variable) {
    return variable.toUpperCase() in this.data || variable in this.data
  }
}

module.exports = Env
