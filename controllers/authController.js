const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const dummyUser = {
    username: 'saltman',
    password: bcrypt.hashSync('oai1122', 10)
};

exports.login = (req, res) => {
    const { username, password } = req.body;
    if (username === dummyUser.username && bcrypt.compareSync(password, dummyUser.password)) {
        const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    } else {
        res.status(401).json({ message: 'Invalid credentials' });
    }
};
