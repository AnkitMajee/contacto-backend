# contractro-backend
Create the Directory Structure
Create the following directory structure:

arduino
Copy code
contacto/
├── config/
│ └── db.js
├── models/
│ └── Contact.js
├── routes/
│ ├── auth.js
│ ├── contact.js
├── middleware/
│ └── auth.js
├── utils/
│ ├── encryption.js
├── .env
└── server.js
3. Configure MongoDB Connection
config/db.js:

js

const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
try {
await mongoose.connect(process.env.MONGO_URI, {
useNewUrlParser: true,
useUnifiedTopology: true,
});
console.log('MongoDB connected...');
} catch (err) {
console.error(err.message);
process.exit(1);
}
};

module.exports = connectDB;
4. Define the Contact Model
models/Contact.js:

js

const mongoose = require('mongoose');

const ContactSchema = new mongoose.Schema({
name: { type: String, required: true },
phone: { type: Number, required: true },
email: { type: String, default: null },
linkedin: { type: String, default: null },
twitter: { type: String, default: null }
});

module.exports = mongoose.model('Contact', ContactSchema);
5. Create Middleware for Authentication
middleware/auth.js:

js

const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = function (req, res, next) {
const token = req.header('x-auth-token');
if (!token) {
return res.status(401).json({ msg: 'No token, authorization denied' });
}

try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
} catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
}
};
6. Create Utility Functions for Encryption
utils/encryption.js:

js

const crypto = require('crypto');
require('dotenv').config();

const algorithm = 'aes-256-cbc';
const key = crypto.randomBytes(32);
const iv = crypto.randomBytes(16);

const encrypt = (text) => {
let cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
let encrypted = cipher.update(text);
encrypted = Buffer.concat([encrypted, cipher.final()]);
return { iv: iv.toString('hex'), encryptedData: encrypted.toString('hex') };
};

const decrypt = (text) => {
let iv = Buffer.from(text.iv, 'hex');
let encryptedText = Buffer.from(text.encryptedData, 'hex');
let decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), iv);
let decrypted = decipher.update(encryptedText);
decrypted = Buffer.concat([decrypted, decipher.final()]);
return decrypted.toString();
};

module.exports = { encrypt, decrypt };
7. Define the Routes
routes/auth.js:

js

const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const router = express.Router();

// Dummy credentials
const dummyUser = {
username: 'saltman',
password: bcrypt.hashSync('oai1122', 10)
};

// Login API
router.post('/login', (req, res) => {
const { username, password } = req.body;

if (username !== dummyUser.username) {
    return res.status(400).json({ msg: 'Invalid credentials' });
}

const isMatch = bcrypt.compareSync(password, dummyUser.password);
if (!isMatch) {
    return res.status(400).json({ msg: 'Invalid credentials' });
}

const payload = {
    user: { id: dummyUser.username }
};

jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
    if (err) throw err;
    res.json({ token });
});
});

module.exports = router;
routes/contact.js:

js

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const auth = require('../middleware/auth');
const Contact = require('../models/Contact');
const { encrypt, decrypt } = require('../utils/encryption');

const router = express.Router();

// Create contact API
router.post('/create', auth, async (req, res) => {
const { name, phone, email, linkedin, twitter } = req.body;

const newContact = new Contact({
    id: uuidv4(),
    name: encrypt(name).encryptedData,
    phone: encrypt(phone.toString()).encryptedData,
    email: email ? encrypt(email).encryptedData : null,
    linkedin: linkedin ? encrypt(linkedin).encryptedData : null,
    twitter: twitter ? encrypt(twitter).encryptedData : null
});

try {
    const contact = await newContact.save();
    res.json({ msg: 'Contact created successfully', contact });
} catch (err) {
    res.status(500).json({ msg: 'Server error' });
}
});

// Edit contact API
router.put('/edit', auth, async (req, res) => {
const { name, email, linkedin, twitter } = req.body;

try {
    let contact = await Contact.findOne({ name: encrypt(name).encryptedData });
    if (!contact) {
        return res.status(404).json({ msg: 'Contact not found' });
    }

    if (email) contact.email = encrypt(email).encryptedData;
    if (linkedin) contact.linkedin = encrypt(linkedin).encryptedData;
    if (twitter) contact.twitter = encrypt(twitter).encryptedData;

    await contact.save();
    res.json({ msg: 'Contact updated successfully', contact });
} catch (err) {
    res.status(500).json({ msg: 'Server error' });
}
});

// Search contact API
router.post('/search', auth, async (req, res) => {
const { search_token } = req.body;

try {
    let contacts = await Contact.find();
    contacts = contacts.filter(contact => decrypt(contact.name).includes(search_token));
    if (contacts.length === 0) {
        return res.status(404).json({ msg: 'No contacts found' });
    }

    res.json(contacts.map(contact => ({
        id: contact.id,
        name: decrypt(contact.name),
        phone: decrypt(contact.phone),
        email: contact.email ? decrypt(contact.email) : null,
        linkedin: contact.linkedin ? decrypt(contact.linkedin) : null,
        twitter: contact.twitter ? decrypt(contact.twitter) : null
    })));
} catch (err) {
    res.status(500).json({ msg: 'Server error' });
}
});

module.exports = router;
8. Create the Main Server File
server.js:

js

const express = require('express');
const connectDB = require('./config/db');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();

// Connect to database
connectDB();

// Middleware
app.use(bodyParser.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/contact', require('./routes/contact'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(Server started on port ${PORT}));
9. Environment Variables
.env:

makefile

MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=as2809
10. Testing with Postman
Login API: Send a POST request to http://localhost:5000/api/auth/login with JSON body:

json

{
"username": "saltman",
"password": "oai1122"
}

json

{
"name": "Billy Butcher",
"phone": 144888,
"email": null,
"linkedin": null,
"twitter": null
}
I

json

{
"name": "Billy Butcher",
"twitter": "anti_vought01"
}
