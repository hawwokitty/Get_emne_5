const sql = require("mssql");

const config = {
    server: "HSA001\\SQLEXPRESS", // Specify localhost if it's a local instance
    database: "expressxnode",
    options: {
        encrypt: false, // Usually false for on-premises
        trustServerCertificate: true, // True for development
        integratedSecurity: true, // Use this for Windows Authentication
    }
};

sql.connect(config, err => {
    if (err) {
        console.error('Error connecting to SQL Server:', err); // Log the full error for more details
    } else {
        console.log('Connection successful');
    }
});
