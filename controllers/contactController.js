const Contact = require('../models/Contact');
const crypto = require('crypto');

const algorithm = 'aes-256-ctr';
const secretKey = process.env.JWT_SECRET;

const encrypt = (text) => {
    const cipher = crypto.createCipher(algorithm, secretKey);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
};

const decrypt = (text) => {
    const decipher = crypto.createDecipher(algorithm, secretKey);
    let decrypted = decipher.update(text, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
};

exports.createContact = async (req, res) => {
    const { name, phone, email, linkedin, twitter } = req.body;
    const contact = new Contact({
        name: encrypt(name),
        phone,
        email: email ? encrypt(email) : null,
        linkedin: linkedin ? encrypt(linkedin) : null,
        twitter: twitter ? encrypt(twitter) : null
    });
    await contact.save();
    res.json({ message: 'Contact created successfully' });
};

exports.editContact = async (req, res) => {
    const { name, email, linkedin, twitter } = req.body;
    const contact = await Contact.findOne({ name: encrypt(name) });
    if (!contact) {
        return res.status(404).json({ message: 'Contact not found' });
    }

    if (email) contact.email = encrypt(email);
    if (linkedin) contact.linkedin = encrypt(linkedin);
    if (twitter) contact.twitter = encrypt(twitter);

    await contact.save();
    res.json({ message: 'Contact updated successfully' });
};

exports.searchContact = async (req, res) => {
    const { search_token } = req.body;
    const contacts = await Contact.find();
    const results = contacts.filter(contact => decrypt(contact.name).includes(search_token))
        .map(contact => ({
            id: contact._id,
            name: decrypt(contact.name),
            phone: contact.phone,
            email: contact.email ? decrypt(contact.email) : null,
            linkedin: contact.linkedin ? decrypt(contact.linkedin) : null,
            twitter: contact.twitter ? decrypt(contact.twitter) : null
        }));
    res.json(results);
};
