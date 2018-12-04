# Env

![Made For NPM](https://img.shields.io/badge/Made%20for-NPM-orange.svg)

Add, edit, delete and read variables from a .env file.

## Installation
```
npm i @marknotton/env --save-dev
```
```js
const env = require('@marknotton/env');
```

## Data functions

### Get File [*string*]

Get the .env file contents as a string

```js
env.getFile()
```

*First parameter can be the path to your .env file relative to the gulpfile.js*

### Get Data [*object*]

Get the .env file content with all the variables and values passed into an object

```js
env.getData()
```

*First parameter can be a direct request for a variable.*
*Second parameter can be the path to your .env file relative to the gulpfile.js*

## Get & Set functions

### Set Variable

Add a variable and value to the .env file. Variable will be created if it isn't found. It will be overwritten if it does exists.

```js
env.setVariable(variable, value)
```

### Get Variable [*string*]

Get variable from .env file.

```js
env.getVariable(variable)
```

## Credit
Couldn't have built this without [gulp-dotenv](https://github.com/pine/gulp-dotenv). Thank you!
