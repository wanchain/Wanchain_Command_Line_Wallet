
const fs = require('fs');
const Q = require('bluebird');
const Loki = require('lokijs');
const log = require('./utils/logger').create('Db');
const path = require('path');
module.exports = class wandb
{
    constructor(dbName) {
        this.dbName = dbName;
        this.db = null;
    }
    init() {
        var temp = this;
        let filePath = __dirname + '/../LocalDb/' + this.dbName;
    //    web3Require.logger.debug(filePath);
        if(!fs.existsSync(__dirname + '/../LocalDb/'))
        {
            fs.mkdir(__dirname + '/../LocalDb/');
        }
        return Q.try(() => {
            // if db file doesn't exist then create it
            try {
                log.debug(`Check that db exists and it's writeable: ${filePath}`);
                fs.accessSync(filePath, fs.R_OK | fs.W_OK);
                return Q.resolve();
            } catch (err) {
                log.info(`Creating db: ${filePath}`);

                const tempdb = new Loki(filePath, {
                    env: 'NODEJS',
                    autoload: false,
                });

                return new Q.promisify(tempdb.saveDatabase, { context: tempdb })();
            }
        })
        .then(() => {
            log.info(`Loading db: ${filePath}`);

            return new Q((resolve, reject) => {
                temp.db = new Loki(filePath, {
                    env: 'NODEJS',
                    autosave: true,
                    autosaveInterval: 5000,
                    autoload: true,
                    autoloadCallback(err) {
                        if (err) {
                            log.error(err);
                            reject(new Error('Error instantiating db'));
                        }
                        resolve();
                    },
                });
            });
        });
    }

    getCollection(name,uniqueID){
        if (!this.db.getCollection(name)) {
            if(uniqueID)
            {
                this.db.addCollection(name, {unique: ['_id']});
            }
            else
            {
                this.db.addCollection(name, {unique: [uniqueID]});
            }
        }
        return this.db.getCollection(name);
    }


    close(){
        return new Q((resolve, reject) => {
            this.db.close((err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }
};

