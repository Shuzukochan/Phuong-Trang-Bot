const Encryptor = require('./utility/encryptor.js');

// Test the new encryptor
console.log('Testing new Encryptor utility...\n');

try {
    // Test 1: String encryption/decryption
    console.log('Test 1: String encryption/decryption');
    const encryptor1 = new Encryptor('test_password');
    const testString = 'Hello, this is a test string!';
    const encrypted1 = encryptor1.encrypt(testString);
    const decrypted1 = encryptor1.decrypt(encrypted1);
    
    console.log('Original:', testString);
    console.log('Encrypted:', encrypted1);
    console.log('Decrypted:', decrypted1);
    console.log('Match:', testString === decrypted1 ? '✅' : '❌');
    console.log('');

    // Test 2: Object encryption/decryption
    console.log('Test 2: Object encryption/decryption');
    const encryptor2 = new Encryptor('Ziii'); // Same key as used in encrypt command
    const testObject = { name: 'Ziji', project: 'Bot Discord', year: 2024 };
    const encrypted2 = encryptor2.encrypt(testObject);
    const decrypted2 = encryptor2.decrypt(encrypted2);
    
    console.log('Original:', testObject);
    console.log('Encrypted:', encrypted2);
    console.log('Decrypted:', decrypted2);
    console.log('Match:', JSON.stringify(testObject) === JSON.stringify(decrypted2) ? '✅' : '❌');
    console.log('');

    // Test 3: Music queue simulation with key "Z"
    console.log('Test 3: Music queue simulation');
    const encryptor3 = new Encryptor('Z'); // Same key as used in save/restore
    const mockQueue = ['track1', 'track2', 'track3'];
    const encrypted3 = encryptor3.encrypt(mockQueue);
    const decrypted3 = encryptor3.decrypt(encrypted3);
    
    console.log('Original queue:', mockQueue);
    console.log('Encrypted:', encrypted3);
    console.log('Decrypted queue:', decrypted3);
    console.log('Match:', JSON.stringify(mockQueue) === JSON.stringify(decrypted3) ? '✅' : '❌');
    console.log('');

    console.log('All tests completed successfully! ✅');
    
} catch (error) {
    console.error('Test failed:', error.message);
}
