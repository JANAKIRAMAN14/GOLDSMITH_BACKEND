"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordRoutes = recordRoutes;
const record_controller_1 = require("../controllers/record.controller");
async function recordRoutes(app) {
    app.get('/', { preHandler: [app.authenticate] }, record_controller_1.listRecordsController);
    app.post('/', { preHandler: [app.authenticate] }, record_controller_1.createRecordController);
    app.patch('/:id', { preHandler: [app.authenticate] }, record_controller_1.updateRecordController);
    app.patch('/:id/image', { preHandler: [app.authenticate] }, record_controller_1.updateRecordImageController);
    app.patch('/:id/status', { preHandler: [app.authenticate] }, record_controller_1.toggleRecordStatusController);
    app.delete('/:id', { preHandler: [app.authenticate] }, record_controller_1.deleteRecordController);
}
