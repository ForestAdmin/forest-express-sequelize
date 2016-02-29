# Forest Express/Sequelize connector
[![Build Status](https://travis-ci.org/ForestAdmin/forest-express-sequelize.svg?branch=master)](https://travis-ci.org/ForestAdmin/forest-express-sequelize)
The official Express/Sequelize liana for Forest.

## Installation

1. Run `$ npm install forest-express-sequelize --save`
2. Add the following code to your `app.js` file:
```javascript
app.use(require('forest-express-sequelize').init({
  modelsDir: __dirname + '/models',  // The directory where all of your Sequelize models are defined.
  secretKey: 'ultrasecretkey', // The secret key given my Forest.
  authKey: 'catsOnKeyboard', // Choose a secret authentication key.
  sequelize: require('sequelize') // The sequelize instance given by require('sequelize').
}));
```

# License

[GPL v3](https://github.com/ForestAdmin/forest-express-sequelize/blob/master/LICENSE)
