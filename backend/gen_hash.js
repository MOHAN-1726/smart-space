import bcrypt from 'bcrypt';
const salt = await bcrypt.genSalt(10);
const hash = await bcrypt.hash('password123', salt);
console.log(hash);
