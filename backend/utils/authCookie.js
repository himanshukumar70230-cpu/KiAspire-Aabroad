// Shared cookie options for the httpOnly session cookies set alongside the
// bearer JWT on login/register. These cookies are never read by frontend
// JS (httpOnly) — they exist solely so pageGuard.js can gate the
// dashboard.html/admin/** HTML shells server-side on a plain browser
// navigation, which has no way to attach an Authorization header.
//
// maxAge is a fixed 7 days regardless of JWT_EXPIRE — harmless if it
// slightly outlives the token, since pageGuard verifies the JWT's own
// expiry on every request anyway.
const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function setAuthCookie(req, res, name, token) {
  res.cookie(name, token, {
    httpOnly: true,
    secure: req.secure,
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE_MS,
    path: "/",
  });
}

function clearAuthCookie(res, name) {
  res.clearCookie(name, { path: "/" });
}

module.exports = { setAuthCookie, clearAuthCookie };
