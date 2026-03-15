
export const tenantMiddleware = async (req, res, next) => {
    try {
        let organizationId = req.headers['x-organization-id'];
        req.tenantId = organizationId;
        next();
    } catch (err) {
        next(err);
    }
};

export const requireTenant = (req, res, next) => {
    if (!req.tenantId) {
        return res.status(400).json({ error: 'Organization context is required' });
    }
    next();
};
