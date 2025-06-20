const sql = require("mssql");

const config = {
    user: "wbuser",
    password: "Sawit@2025",
    server: "localhost", // or your server IP/name
    database: "WBStagingDB",
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log("Connected to MSSQL");
        return pool;
    })
    .catch(err => console.error("Database Connection Failed!", err));

module.exports = {
    sql,
    poolPromise
};