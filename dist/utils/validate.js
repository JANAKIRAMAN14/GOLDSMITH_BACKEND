"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeText = sanitizeText;
exports.isValidEmail = isValidEmail;
exports.isStrongPassword = isStrongPassword;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function sanitizeText(value, maxLength = 200) {
    if (typeof value !== 'string')
        return '';
    const cleaned = value.replace(/[\u0000-\u001F\u007F]/g, '').trim();
    return cleaned.slice(0, maxLength);
}
function isValidEmail(value) {
    return EMAIL_REGEX.test(value);
}
function isStrongPassword(value) {
    if (value.length < 8)
        return false;
    const hasLetter = /[A-Za-z]/.test(value);
    const hasNumber = /\d/.test(value);
    return hasLetter && hasNumber;
}
