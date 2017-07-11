/**
 * @file lokiCryptedFileAdapter.js
 * @author Hans Klunder <Hans.Klunder@bigfoot.com>
 */

/*
 * The default Loki File adapter uses plain text JSON files. This adapter crypts the database string and wraps the result
 * in a JSON including enough info to be able to decrypt it (except for the 'secret' of course !)
 *
 * The idea is that the 'secret' does not reside in your source code but is supplied by some other source (e.g. the user in node-webkit)
 *
 * The idea + encrypt/decrypt routines are borrowed from  https://github.com/mmoulton/krypt/blob/develop/lib/krypt.js
 * not using the krypt module to avoid third party dependencies
 */


/**
 * require libs
 * @ignore
 */
const fs = require('fs');
const cryptoLib = require('crypto');
const isError = require('util').isError;

/*
 * sensible defaults
 */
const CIPHER = 'aes-256-cbc';

const KEY_DERIVATION = 'pbkdf2';
const KEY_LENGTH = 256;
const ITERATIONS = 64000;

/**
 * encrypt() - encrypt a string
 * @private
 * @param {string} input - the serialized JSON object to decrypt.
 * @param {string} secret - the secret to use for encryption
 */
function encrypt(input, secret) {
  if (!secret) {
    return new Error('A \'secret\' is required to encrypt');
  }


  const salt = cryptoLib.randomBytes(KEY_LENGTH / 8);
  const iv = cryptoLib.randomBytes(16);

  try {
    const key = cryptoLib.pbkdf2Sync(secret, salt, ITERATIONS, KEY_LENGTH / 8, 'sha1');
    const cipher = cryptoLib.createCipheriv(CIPHER, key, iv);

    let encryptedValue = cipher.update(input, 'utf8', 'base64');
    encryptedValue += cipher.final('base64');

    const result = {
      cipher: CIPHER,
      keyDerivation: KEY_DERIVATION,
      keyLength: KEY_LENGTH,
      iterations: ITERATIONS,
      iv: iv.toString('base64'),
      salt: salt.toString('base64'),
      value: encryptedValue
    };
    return result;
  } catch (err) {
    return new Error('Unable to encrypt value due to: ' + err);
  }
}

/**
 * decrypt() - Decrypt a serialized JSON object
 * @private
 * @param {string} input - the serialized JSON object to decrypt.
 * @param {string} secret - the secret to use for decryption
 */
function decrypt(input, secret) {
	// Ensure we have something to decrypt
  if (!input) {
    return new Error('You must provide a value to decrypt');
  }
	// Ensure we have the secret used to encrypt this value
  if (!secret) {
    return new Error('A \'secret\' is required to decrypt');
  }

	// turn string into an object
  try {
    input = JSON.parse(input);
  } catch (err) {
    return new Error('Unable to parse string input as JSON');
  }

	// Ensure our input is a valid object with 'iv', 'salt', and 'value'
  if (!input.iv || !input.salt || !input.value) {
    return new Error('Input must be a valid object with \'iv\', \'salt\', and \'value\' properties');
  }

  const salt = new Buffer(input.salt, 'base64');
  const iv = new Buffer(input.iv, 'base64');
  const keyLength = input.keyLength;
  const iterations = input.iterations;

  try {
    const key = cryptoLib.pbkdf2Sync(secret, salt, iterations, keyLength / 8, 'sha1');
    const decipher = cryptoLib.createDecipheriv(CIPHER, key, iv);

    let decryptedValue = decipher.update(input.value, 'base64', 'utf8');
    decryptedValue += decipher.final('utf8');

    return decryptedValue;
  } catch (err) {
    return new Error('Unable to decrypt value due to: ' + err);
  }
}

/**
 * The constructor is automatically called on `require` , see examples below
 * @constructor
 */
export class lokiCryptedFileAdapter {
	/**
	 * setSecret() - set the secret to be used during encryption and decryption
	 *
	 * @param {string} secret - the secret to be used
	 */
  setSecret(secret) {
    this.secret = secret;
  }

	/**
	 * loadDatabase() - Retrieves a serialized db string from the catalog.
	 *
	 *  @example
	 // LOAD
	 let cryptedFileAdapter = require('./lokiCryptedFileAdapter');
	 cryptedFileAdapter.setSecret('mySecret'); // you should change 'mySecret' to something supplied by the user
	 let db = new loki('test.crypted', { adapter: cryptedFileAdapter }); //you can use any name, not just '*.crypted'
	 db.loadDatabase(function(result) {
            console.log('done');
        });
	 *
	 * @param {string} dbname - the name of the database to retrieve.
	 * @returns {Promise} a Promise that resolves after the database was loaded
	 */
  loadDatabase(dbname) {
    const secret = this.secret;

    return new Promise((resolve, reject) => {
      fs.readFile(dbname, 'utf8', (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(decrypt(data, secret));
        }
      });
    });
  }

	/**
	 *
	 @example
	 // SAVE : will save database in 'test.crypted'
	 let cryptedFileAdapter = require('./lokiCryptedFileAdapter');
	 cryptedFileAdapter.setSecret('mySecret'); // you should change 'mySecret' to something supplied by the user
	 let loki=require('lokijs');
	 let db = new loki('test.crypted',{ adapter: cryptedFileAdapter }); //you can use any name, not just '*.crypted'
	 let coll = db.addCollection('testColl');
	 coll.insert({test: 'val'});
	 db.saveDatabase();  // could pass callback if needed for async complete

	 @example
	 // if you have the krypt module installed you can use:
	 krypt --decrypt test.crypted --secret mySecret
	 to view the contents of the database

	 * saveDatabase() - Saves a serialized db to the catalog.
	 *
	 * @param {string} dbname - the name to give the serialized database within the catalog.
	 * @param {string} dbstring - the serialized db string to save.
	 * @returns {Promise} a Promise that resolves after the database was persisted
	 */
  saveDatabase(dbname, dbstring) {
    const encrypted = encrypt(dbstring, this.secret);

    if (!isError(encrypted)) {
      return new Promise((resolve, reject) => {
        fs.writeFile(dbname,
					JSON.stringify(encrypted, null, '  '),
					'utf8', (err) => {
  if (err) {
    reject(err);
  } else {
    resolve();
  }
});
      });
    } else { // Error !
      return Promise.reject(encrypted);
    }
  }
}