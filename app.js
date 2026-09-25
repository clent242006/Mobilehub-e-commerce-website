const express = require("express");
const session = require("express-session");
const db = require("./database/database");

const app = express();

app.use(session({
    secret: "mobilehub-secret",
    resave: false,
    saveUninitialized: true
}));

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// Home page
app.get("/", (req, res) => {
    const products = db.prepare(`
        SELECT * FROM products
        LIMIT 6
    `).all();

    res.render("index", { products });
});

// Products page
app.get("/products", (req, res) => {
    const products = db.prepare(`
        SELECT * FROM products
    `).all();

    res.render("products", { products });
});

// Product details
app.get("/product/:id", (req, res) => {
    const product = db.prepare(`
        SELECT * FROM products
        WHERE id = ?
    `).get(req.params.id);

    if (!product) {
        return res.send("Product not found");
    }

    res.render("product-details", { product });
});

app.post("/cart/add/:id", (req, res) => {

    const product = db.prepare(`
        SELECT * FROM products
        WHERE id = ?
    `).get(req.params.id);

    if (!product) {
        return res.send("Product not found");
    }

    if (!req.session.cart) {
        req.session.cart = [];
    }

    const existingProduct = req.session.cart.find(
        item => item.id === product.id
    );

    if (existingProduct) {
        existingProduct.quantity += 1;
    } else {
        req.session.cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1
        });
    }

    res.redirect("/cart");
});

// Admin dashboard
app.get("/admin", (req, res) => {
    const products = db.prepare(`
        SELECT * FROM products
    `).all();

    const orders = db.prepare(`
        SELECT * FROM orders
        ORDER BY id DESC
    `).all();

    res.render("admin/dashboard", {
        products,
        orders
    });
});

app.get("/cart", (req, res) => {

    const cart = req.session.cart || [];

    let total = 0;

    cart.forEach(item => {
        total += item.price * item.quantity;
    });

    res.render("cart", {
        cart,
        total
    });
});

app.get("/checkout", (req, res) => {

    const cart = req.session.cart || [];

    if (cart.length === 0) {
        return res.redirect("/cart");
    }

    let total = 0;

    cart.forEach(item => {
        total += item.price * item.quantity;
    });

    res.render("checkout", {
        total
    });
});


///Checkout///
app.post("/checkout", (req, res) => {

    const cart = req.session.cart || [];

    if (cart.length === 0) {
        return res.redirect("/cart");
    }

    const {
        customer_name,
        customer_email,
        address
    } = req.body;

    let total = 0;

    cart.forEach(item => {
        total += item.price * item.quantity;
    });

    const order = db.prepare(`
        INSERT INTO orders
        (customer_name, customer_email, address, total)
        VALUES (?, ?, ?, ?)
    `).run(
        customer_name,
        customer_email,
        address,
        total
    );

    const orderId = order.lastInsertRowid;

    const insertItem = db.prepare(`
        INSERT INTO order_items
        (order_id, product_id, quantity, price)
        VALUES (?, ?, ?, ?)
    `);

    cart.forEach(item => {
        insertItem.run(
            orderId,
            item.id,
            item.quantity,
            item.price
        );
    });

    req.session.cart = [];

    res.send(`
        <h1>Order Successful!</h1>

        <p>Your order number is #${orderId}</p>

        <p>Total: ₱${total.toLocaleString()}</p>

        <a href="/products">
            Continue Shopping
        </a>
    `);
});

///Add producst///
app.get("/admin/products/add", (req, res) => {
    res.render("admin/add-product");
});

app.post("/admin/products/add", (req, res) => {

    const {
        name,
        description,
        price,
        stock,
        category_id
    } = req.body;

    db.prepare(`
        INSERT INTO products
        (name, description, price, stock, category_id)
        VALUES (?, ?, ?, ?, ?)
    `).run(
        name,
        description,
        price,
        stock,
        category_id
    );

    res.redirect("/admin");
});


// Edit product page
app.get("/admin/products/edit/:id", (req, res) => {

    const product = db.prepare(`
        SELECT * FROM products
        WHERE id = ?
    `).get(req.params.id);

    if (!product) {
        return res.send("Product not found");
    }

    res.render("admin/edit-product", { product });
});

// Update product
app.post("/admin/products/edit/:id", (req, res) => {

    const {
        name,
        description,
        price,
        stock,
        category_id
    } = req.body;

    db.prepare(`
        UPDATE products
        SET name = ?,
            description = ?,
            price = ?,
            stock = ?,
            category_id = ?
        WHERE id = ?
    `).run(
        name,
        description,
        price,
        stock,
        category_id,
        req.params.id
    );

    res.redirect("/admin");
});

app.post("/admin/products/delete/:id", (req, res) => {

    const product = db.prepare(`
        SELECT * FROM products
        WHERE id = ?
    `).get(req.params.id);

    if (!product) {
        return res.send("Product not found");
    }

    db.prepare(`
        DELETE FROM products
        WHERE id = ?
    `).run(req.params.id);

    res.redirect("/admin");
});

app.get("/admin/orders", (req, res) => {

    const orders = db.prepare(`
        SELECT * FROM orders
        ORDER BY id DESC
    `).all();

    res.render("admin/orders", {
        orders
    });
});

app.post("/admin/orders/status/:id", (req, res) => {

    const { status } = req.body;

    db.prepare(`
        UPDATE orders
        SET status = ?
        WHERE id = ?
    `).run(
        status,
        req.params.id
    );

    res.redirect("/admin/orders");
});

app.listen(8000, () => {
    console.log("MobileHub running at http://localhost:8000");
});