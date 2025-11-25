const jwt = require('jsonwebtoken');
const SuperAdmin = require('../models/SuperAdmin');

const superAdminAuthMiddleware = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ error: 'No authentication token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const superAdmin = await SuperAdmin.findById(decoded.id);

        if (!superAdmin) {
            return res.status(401).json({ error: 'SuperAdmin not found' });
        }

        if (!superAdmin.isActive) {
            return res.status(403).json({ error: 'Account is deactivated' });
        }

        req.superAdmin = superAdmin;
        req.token = token;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Please authenticate as SuperAdmin' });
    }
};

module.exports = superAdminAuthMiddleware;