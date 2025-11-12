function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) return next();

  req.flash('error', 'Please login first');

  // เก็บ URL ปัจจุบันเพื่อ redirect กลับหลัง login
  const fullUrl = req.originalUrl;
  return res.redirect(`/login?next=${encodeURIComponent(fullUrl)}`);
}

function hasRole(role) {
  return (req, res, next) => {
    if (!req.session || !req.session.user) {
      req.flash('error', 'Please login');
      const fullUrl = req.originalUrl;
      return res.redirect(`/login?next=${encodeURIComponent(fullUrl)}`);
    }
    if (req.session.user.role !== role) {
      return res.status(403).render('403');
    }
    next();
  };
}

module.exports = { isAuthenticated, hasRole };
