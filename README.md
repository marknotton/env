# Env Modify

Add, edit, delete and read variables from a .env file.

This was originally built with Gulp tasks streams in mind, but Gulp is not actually a requirement. This tool can used as a standalone node package.

### Installation
```
npm i gulp-env-modify --save
```
### Setup
```
const envmod = require('gulp-env-modify')
const env = envmod.getData()
console.log(env)
```
------

## Data functions

### Get File [*string*]

Get the .env file contents as a string

`envmod.getFile()`

*First parameter can be the path to your .env file relative to the gulpfile.js*

------

### Get Data [*object*]

Get the .env file content with all the variables and values passed into an object

`envmod.getData()`

*First parameter can be a direct request for a variable.*
*Second parameter can be the path to your .env file relative to the gulpfile.js*

------

## Get & Set functions

### Set Variable

Add a variable and value to the .env file. Variable will be created if it isn't found. It will be overwritten if it does exists.

`envmod.setVariable(variable, value)`

------

### Get Variable [*string*]

Get variable from .env file.

`envmod.getVariable(variable)`

------

### Credit
Couldn't have built this without [gulp-dotenv](https://github.com/pine/gulp-dotenv). Thank you.
