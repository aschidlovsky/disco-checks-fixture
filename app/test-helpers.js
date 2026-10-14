// Test support the checks import from outside the test roots (INI-102 F8 live leg: an unprotected import).
module.exports = { apiHeaders: () => ({ "x-api-token": process.env.E2E_API_TOKEN || "" }) };
