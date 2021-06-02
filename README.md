<img src="https://get.snaz.in/88HByqU.png" height="50">

A [Dexare](https://github.com/Dexare/Dexare) module for managing [crons](https://npm.im/cron).

```sh
npm install @dexare/cron
```

```js
const { DexareClient } = require('dexare');
const CronModule = require('@dexare/cron');

const config = {
  // All props in this config are optional, defaults are shown unless told otherwise
  cron: {
    // The folder path to load upon loading the module, defaults to none
    // When registering crons in a folder, they must end with `.cron.js`
    loadFolder: './src/crons'
  }
}

const client = new DexareClient(config);
client.loadModules(CronModule);

const cron = client.modules.get('cron');
// You can choose to register crons from folders
cron.registerFromFolder('./src/crons');
// Or register a cron directly
cron.register({
  name: 'example-cron',
  time: '0 * * * *', // Hourly
  onTick: (client, job) => {
    console.log(`This cron executed at ${job.lastDate}`)
  }
});
```

### Cron File Example
This example cron flushes throttle data within memory data managers.
Options are the same as [CronJob's constructor parameters](https://www.npmjs.com/package/cron#api), except a new parameter `name` must be given to identify the job, and `context` will not be used in the construction of a new cron job.
```js
// ./src/crons/flushThrottles.cron.js

module.exports = {
  name: 'flush-throttles',
  time: '0 * * * *', // Hourly
  onTick: (client, job) => {
    this.client.data.flushThrottles()
  }
}
```
