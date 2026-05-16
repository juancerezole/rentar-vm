// Wrap para handlers async que pasa errores al error handler de Express.
// Sin esto, los rejects de promesas en handlers async se pierden.
export const wrap = fn => (req, res, next) => fn(req, res, next).catch(next);
