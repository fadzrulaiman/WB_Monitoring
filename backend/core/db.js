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

// Add a reusable SQL executor function
async function execute(query, params = []) {
    const pool = await poolPromise;
    const request = pool.request();
    for (const { name, type, value } of params) {
        request.input(name, type, value);
    }
    return request.query(query);
}

module.exports = {
    sql,
    poolPromise,
    execute // export the executor
};