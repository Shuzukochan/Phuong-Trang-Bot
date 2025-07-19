const crypto = require('crypto');

class Encryptor {
  constructor(key = 'PhuongTrang') {
    this.key = crypto.createHash('sha256').update(key).digest();
    this.algorithm = 'aes-256-cbc';
  }

  encrypt(text) {
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher(this.algorithm, this.key);
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      return iv.toString('hex') + ':' + encrypted;
    } catch (error) {
      throw new Error('Encryption failed: ' + error.message);
    }
  }

  decrypt(encryptedData) {
    try {
      const parts = encryptedData.split(':');
      const iv = Buffer.from(parts.shift(), 'hex');
      const encrypted = parts.join(':');
      const decipher = crypto.createDecipher(this.algorithm, this.key);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      throw new Error('Decryption failed: ' + error.message);
    }
  }
}

module.exports = Encryptor; 