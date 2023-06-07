
# Env

![Made For NPM](https://img.shields.io/badge/Made%20for-NPM-orange.svg)

Add, edit, delete and read variables from a .env file.

## Installation
```
npm i @marknotton/env --save-dev
```
```js
import Env from '@marknotton/env'

```

## Usage

Basic usage
```
const env = new Env()
```

You can defined a different .env file by passing in a string that is relative path.

 ```
const env = new Env('.env.example')
```

## Methods

### Set Variable

Add a variable and value to the .env file. Variable will be created if it isn't found. It will be overwritten if it does exists.

```js
env.set(variable, value)
```

### Delete Variable

Delete variable from .env file.

```js
env.delete(variable)
```

### Toggle Variable

Add a 'true' boolean to the given vairable, or remove it entirely if it's false. 

```js
env.toggleBoolean(variable, true)  // Add's VARIABLE=true 
env.toggleBoolean(variable, false) // Removes VARIABLE=true entirely 
```

### Get Variable

Get variable from .env file.

```js
env.get(variable)
```

### Has Variable

Check if a variable exists.

```js
env.has(variable)
```

