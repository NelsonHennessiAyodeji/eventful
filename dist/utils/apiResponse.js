"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorResponse = exports.successResponse = void 0;
const successResponse = (res, data, message = "Success", status = 200) => {
    return res.status(status).json({ success: true, message, data });
};
exports.successResponse = successResponse;
const errorResponse = (res, message = "Error", status = 400) => {
    return res.status(status).json({ success: false, message });
};
exports.errorResponse = errorResponse;
