"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.todayString = todayString;
exports.isSameDay = isSameDay;
function todayString() {
    return new Date().toISOString().slice(0, 10);
}
function isSameDay(dateA, dateString) {
    if (!dateA)
        return false;
    return dateA.toISOString().slice(0, 10) === dateString;
}
