const fs = require('fs');
const path = require('path');

class TransactionLogger {
    constructor() {
        this.logDir = path.join(__dirname, '../../logs/transactions');
        this.globalLogPath = path.join(this.logDir, 'global_transactions.json');

        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    /**
     * Logs a database-mirrored transaction.
     * @param {string} entity - The DB table name (e.g., 'wp_posts', 'wp_users')
     * @param {string} id - The unique ID of the record
     * @param {Object} data - The record data in DB format
     */
    async logTransaction(entity, id, data) {
        const timestamp = new Date().toISOString();
        const entry = {
            timestamp,
            entity,
            id,
            data
        };

        // 1. Append to global log (JSON Lines format for performance)
        fs.appendFileSync(this.globalLogPath, JSON.stringify(entry) + '\n');

        // 2. Save as individual "portion" file mirroring the DB record
        const fileName = `${entity}_${id}.json`;
        const filePath = path.join(this.logDir, fileName);

        // Save the raw data (mimicking the DB row)
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

        return { globalLog: this.globalLogPath, individualFile: filePath };
    }
}

module.exports = TransactionLogger;
