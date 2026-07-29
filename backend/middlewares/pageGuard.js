const jwt = require("jsonwebtoken");

// Server-side gating for the static HTML shells under /dashboard.html and
// /admin/**. Bearer-token auth (authMiddleware.js) already protects every
// API route that returns real data — this middleware exists so an
// unauthenticated request can't even reach the page shell itself, rather
// than relying solely on the client-side redirect in dashboard.html/
// admin.js, which only runs after the page has already been served.
//
// Deliberately a lightweight check (signature + expiry + role claim only,
// no DB lookup) — the API calls the page goes on to make still enforce the
// full check (user exists, is_active, etc.) via authMiddleware.protect.
// This is just the front door, not the security boundary.
function verifyRoleCookie(cookieValue, role) {
  if (!cookieValue) return false;

  try {
    const decoded = jwt.verify(cookieValue, process.env.JWT_SECRET);
    return decoded.role === role;
  } catch (error) {
    return false;
  }
}

function guardStudentPage(req, res, next) {
  if (verifyRoleCookie(req.cookies?.student_token, "student")) {
    return next();
  }

  return res.redirect("/login.html");
}

function guardAdminPage(req, res, next) {
  // The admin login page itself must stay reachable while logged out.
  if (req.path === "/login.html") {
    return next();
  }

  if (verifyRoleCookie(req.cookies?.admin_token, "admin")) {
    return next();
  }

  return res.redirect("/admin/login.html");
}

module.exports = { guardStudentPage, guardAdminPage };
