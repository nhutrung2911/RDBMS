const sql = require('mssql');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const config = {
  server: process.env.DB_SERVER || "localhost",
  database: process.env.DB_DATABASE || "RDBMS",
  user: process.env.DB_USER || "sa",
  password: process.env.DB_PASSWORD || "",
  port: Number(process.env.DB_PORT) || 1433,
  options: {
    encrypt: process.env.DB_ENCRYPT === "true",
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === "true",
  }
};

async function run() {
  try {
    console.log("Connecting to SQL Server...");
    let pool = await sql.connect(config);
    console.log("Connected! Inserting user 'Nguyễn Văn B'...");
    
    // Check if user already exists
    const checkUser = await pool.request()
      .input("email", sql.VarChar, "customer2@gmail.com")
      .query("SELECT CustomerId FROM Customer WHERE Email = @email");
      
    if (checkUser.recordset.length > 0) {
      console.log("User 'Nguyễn Văn B' already exists in SQL Server!");
    } else {
      await pool.request()
        .input("fullName", sql.NVarChar, "Nguyễn Văn B")
        .input("phone", sql.VarChar, "0123456789")
        .input("email", sql.VarChar, "customer2@gmail.com")
        .query("INSERT INTO Customer (FullName, Phone, Email) VALUES (@fullName, @phone, @email)");
      console.log("User 'Nguyễn Văn B' inserted successfully into Customer table!");
    }
    
    await sql.close();
  } catch (err) {
    console.error("Error inserting user:", err.message);
  }
}
run();
