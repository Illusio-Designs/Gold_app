const { db } = require("../config/db");
const { syncStock } = require("../services/erpStockImport");

syncStock().then((stats) => {
  console.log("ERP stock import complete", stats);
}).catch((error) => {
  console.error("ERP stock import failed:", error.code || error.message);
  process.exitCode = 1;
}).finally(() => db.promise().end());
