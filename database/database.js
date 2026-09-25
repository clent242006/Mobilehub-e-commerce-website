const Database = require("better-sqlite3");

const db = new Database("mobilehub.db");

// Categories table
db.prepare(`
    CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL
    )
`).run();

// Products table
db.prepare(`
    CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        stock INTEGER NOT NULL,
        image TEXT,
        category_id INTEGER,
        FOREIGN KEY (category_id) REFERENCES categories(id)
    )
`).run();

// Orders table
db.prepare(`
    CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_name TEXT NOT NULL,
        customer_email TEXT NOT NULL,
        address TEXT NOT NULL,
        total REAL NOT NULL,
        status TEXT DEFAULT 'Pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`).run();

// Order items table
db.prepare(`
    CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER,
        product_id INTEGER,
        quantity INTEGER,
        price REAL,
        FOREIGN KEY (order_id) REFERENCES orders(id),
        FOREIGN KEY (product_id) REFERENCES products(id)
    )
`).run();

console.log("Database is ready!");

const categoryCount = db.prepare(`
    SELECT COUNT(*) AS count FROM categories
`).get();

if (categoryCount.count === 0) {

    db.prepare(`
        INSERT INTO categories (name)
        VALUES (?)
    `).run("iPhone");

    db.prepare(`
        INSERT INTO categories (name)
        VALUES (?)
    `).run("Samsung");

    db.prepare(`
        INSERT INTO categories (name)
        VALUES (?)
    `).run("Xiaomi");
}

const productCount = db.prepare(`
    SELECT COUNT(*) AS count FROM products
`).get();

if (productCount.count === 0) {

    db.prepare(`
        INSERT INTO products
        (name, description, price, stock, category_id)
        VALUES (?, ?, ?, ?, ?)
    `).run(
        "iPhone 15",
        "Apple iPhone with powerful performance.",
        45000,
        10,
        1
    );

    db.prepare(`
        INSERT INTO products
        (name, description, price, stock, category_id)
        VALUES (?, ?, ?, ?, ?)
    `).run(
        "Samsung Galaxy S24",
        "Samsung smartphone with excellent camera.",
        42000,
        8,
        2
    );

    db.prepare(`
        INSERT INTO products
        (name, description, price, stock, category_id)
        VALUES (?, ?, ?, ?, ?)
    `).run(
        "Xiaomi Redmi Note 13",
        "Affordable smartphone with great features.",
        12000,
        15,
        3
    );
}

module.exports = db;


