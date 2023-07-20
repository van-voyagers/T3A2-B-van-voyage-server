// Import the configured items from the server file:
var { app, PORT } = require("./server");

// Run the server
app.listen(PORT, () => {
  console.log(`
    VV server is now running!

    Congrats!
    `);
});
