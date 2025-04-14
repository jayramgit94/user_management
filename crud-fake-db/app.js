const express = require("express");
const fs = require("fs"); // Required for file system operations
const app = express();
const PORT = 3000;

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public")); // Serve CSS

// 💾 Our fake DB
let fakeDB = [];

// ✅ Flash message support (manual approach)
let flashMessage = "";

// Load data from JSON file when the server starts
function loadDB() {
  try {
    const data = fs.readFileSync("data.json", "utf-8");
    fakeDB = JSON.parse(data);
  } catch (err) {
    console.log("No previous data found. Starting with an empty DB.");
    fakeDB = [];
  }
}

// Write the data to the JSON file
function saveDB() {
  fs.writeFileSync("data.json", JSON.stringify(fakeDB, null, 2), "utf-8");
}

// Load data when the app starts
loadDB();

// Home route with search, sort, and pagination
app.get("/", (req, res) => {
  const searchQuery = req.query.search || ""; // Get search query
  const sortParam = req.query.sort || ""; // Get sort parameter
  const page = parseInt(req.query.page) || 1; // Get current page (default 1)
  const perPage = 5; // Number of users per page

  // Sorting logic
  let sortedUsers = [...fakeDB];
  if (sortParam === "name") {
    sortedUsers.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortParam === "age") {
    sortedUsers.sort((a, b) => a.age - b.age);
  }

  // Filter users based on search query
  const filteredUsers = sortedUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination logic
  const totalUsers = filteredUsers.length;
  const totalPages = Math.ceil(totalUsers / perPage);
  const start = (page - 1) * perPage;
  const end = page * perPage;

  const usersOnPage = filteredUsers.slice(start, end);

  const msg = flashMessage;
  flashMessage = ""; // Clear after showing once
  res.render("index", {
    users: usersOnPage,
    message: msg,
    page,
    totalPages,
    searchQuery,
    sortParam,
  });
});

// Add new user form route
app.get("/add", (req, res) => {
  res.render("add", { error: "" });
});

// Create new user
app.post("/create", (req, res) => {
  const { name, email, age } = req.body;

  // Check if email already exists
  const exists = fakeDB.find((user) => user.email === email);
  if (exists) {
    return res.render("add", { error: "⚠️ Email already exists!" });
  }

  const newUser = {
    id: Date.now(),
    name,
    email,
    age,
  };

  fakeDB.push(newUser); // Save in fake DB
  saveDB(); // Save the updated DB to the file
  flashMessage = "✅ User added successfully!";
  res.redirect("/");
});

// Edit user form route
app.get("/edit/:id", (req, res) => {
  const userId = Number(req.params.id);
  const user = fakeDB.find((u) => u.id === userId);

  if (!user) {
    flashMessage = "⚠️ User not found!";
    return res.redirect("/");
  }

  res.render("edit", { user }); // Render the form with current user data
});

// Update user data
// Update user data
app.post("/update/:id", (req, res) => {
  const userId = Number(req.params.id);
  const { name, email, age } = req.body;

  const userIndex = fakeDB.findIndex((u) => u.id === userId);

  if (userIndex === -1) {
    flashMessage = "⚠️ User not found!";
    return res.redirect("/");
  }

  // Update user data
  fakeDB[userIndex] = { id: userId, name, email, age };
  saveDB(); // Save to the file
  flashMessage = "✅ User updated successfully!";
  res.redirect("/");
});

// Delete user route
app.get("/delete/:id", (req, res) => {
  const userId = Number(req.params.id);
  fakeDB = fakeDB.filter((user) => user.id !== userId);
  saveDB(); // Save the updated DB to the file
  flashMessage = "🗑️ User deleted!";
  res.redirect("/");
});

// Start server
app.listen(PORT, () => {
  console.log(`App running at http://localhost:${PORT}`);
});
