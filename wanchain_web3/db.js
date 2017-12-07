
const fs = require('fs');
const Q = require('bluebird');
const Loki = require('lokijs');
const log = require('./utils/logger').create('Db');


let db;


exports.init = () => {
    const filePath = __dirname + '/../LocalDb/wanchain.db';
    console.log(filePath);

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
            db = new Loki(filePath, {
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
};


exports.getCollection = (name,uniqueID) => {
    if (!db.getCollection(name)) {
        if(uniqueID)
        {
            db.addCollection(name, {unique: ['_id']});
        }
        else
        {
            db.addCollection(name, {unique: [uniqueID]});
        }
    }
    return db.getCollection(name);
};


exports.close = () => {
    return new Q((resolve, reject) => {
        db.close((err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
};
