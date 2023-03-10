const express = require("express");
const app = express();
app.use(express.json());

const sqlite = require("sqlite");
const { open } = sqlite;
const sqlite3 = require("sqlite3");

const path = require("path");
const dbPath = path.join(__dirname, "products.db");

let db = null;

const initializeDB = async () => {
  try {
    db = await open({ filename: dbPath, driver: sqlite3.Database });
    app.listen(3000, () => {
      console.log("Server is running successfully on port 3000");
    });
  } catch (e) {
    console.log(e);
    process.exit(1);
  }
};

initializeDB();

const convert = (each) => {
  return {
    productId: each.product_id,
    quantity: each.quantity,
  };
};

// Creating table. Please create table only once.
app.post("/products-create/", async (request, response) => {
  const createTable =
    "CREATE TABLE product (product_id INT PRIMARY KEY, quantity INT)";
  const dbResponse0 = await db.run(createTable);
});

// Checking the table by getting all entries...
app.get("/products/", async (request, response) => {
  const getAll = "SELECT * FROM product";
  const dbResponse1 = await db.all(getAll);
  const dbResponseConverted = dbResponse1.map((each) => convert(each));
  response.send(dbResponseConverted);
});

// Requesting the required operations...
app.post("/products/", async (request, response) => {
  const payload = request.body;
  payload.forEach(async (each) => {
    try {
      const { productId, quantity, operation } = each;

      const check = `SELECT * FROM WHERE product_id=${productId}`;
      const dbResponse2 = await db.get(check);
      if (dbResponse2 === undefined) {
        if (operation === "add") {
          const insert = `INSERT INTO product(product_id, quantity) values (${productId}, ${quantity})`;
          const dbResponse3 = await db.run(insert);
          console.log("Product not available, so inserted successfully");
        } else {
          console.log("Product not available to subtract");
        }
      } else {
        if (operation === "add") {
          const update = `UPDATE product SET quantity = ${quantity} WHERE product_id = ${productId}`;
          const dbResponse3 = await db.run(update);
          console.log("Product quantity added successfully");
        } else {
          const existingQuantity = convert(dbResponse2).quantity;
          if (existingQuantity >= quantity) {
            const newQuantity = existingQuantity - quantity;
            const remove = `UPDATE product SET quantity = ${newQuantity} WHERE product_id = ${productId}`;
            const dbResponse4 = await db.run(remove);
            console.log("Product quantity subtracted successfully");
          } else {
            const removeAll = `UPDATE product SET quantity = ${0} WHERE product_id = ${productId}`;
            const dbResponse5 = await db.run(removeAll);
            console.log(
              "Available quantity of product is less than the requested, so removing all"
            );
          }
        }
      }
    }
  });
  console.log("All the operations were performed");
});
