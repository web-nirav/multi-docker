const keys = require("./keys");

// Express App setup
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Postgress Client Setup
const { Pool } = require("pg");
const pgClient = new Pool({
  user: keys.pgUser,
  host: keys.pgHost,
  port: keys.pgPort,
  database: keys.pgDatabase,
  password: keys.pgPassword,
});

// this line might not needed but i have added
/* pgClient.on("error", () => console.log("Lost PG connection"));

pgClient.on("connect", () => {
  pgClient
    .query("CREATE TABLE IF NOT EXISTS my_values (number INT)")
    .catch((err) => console.log(err));
}); */

async function initDB() {
  try {
    await pgClient.connect();
    console.log("Connected to Postgres");

    await pgClient.query(`
      CREATE TABLE IF NOT EXISTS my_values (
        id SERIAL PRIMARY KEY,
        number INT
      )
    `);
    console.log("Table my_values is ready");

    // Now you can safely run your queries or start the server
  } catch (err) {
    console.error("DB init error:", err);
  }
}

initDB();

// Redis Client setup
/* const redis = require("redis");
const redisClient = redis.createClient({
  host: keys.redisHost,
  port: keys.redisPort,
  retry_strategy: () => 1000,
}); */

// ✅ Redis Client setup for redis v4+
const { createClient } = require("redis");

const redisClient = createClient({
  url: `redis://${keys.redisHost}:${keys.redisPort}`,
  socket: {
    reconnectStrategy: () => 1000, // retry every 1000ms (1 sec)
  },
});

redisClient.on("error", (err) => console.error("Redis Client Error", err));

(async () => {
  await redisClient.connect();
  console.log("Connected to Redis");
})();

// we create a duplicate redis object as per redis docs we can not use same object for connection and doing other operations, refer redis docs for more info
// Duplicate client for publisher
const redisPublisher = redisClient.duplicate();
(async () => {
  await redisPublisher.connect();
  console.log("Redis Publisher ready");
})();

// Express route handlers
app.get("/", (req, res) => {
  res.send("Hi!");
});

app.get("/values/all", async (req, res) => {
  const values = await pgClient.query("SELECT * FROM my_values");

  // here values object has many differnt things but we just want to return rows out of it
  res.send(values.rows);
});

app.get("/values/current", async (req, res) => {
  try {
    const values = await redisClient.hGetAll("values"); // ✅ v4 method (promise)
    res.send(values);
  } catch (err) {
    console.error("Redis fetch error:", err);
    res.status(500).send("Error fetching from Redis");
  }
});

app.post("/values", async (req, res) => {
  const index = req.body.index;
  if (parseInt(index) > 40) {
    return res.status(422).send("Index too high");
  }

  // ✅ hSet instead of hset (v4)
  // we are storing value as Nothinn yet because our worker process will do fib calc and store
  await redisClient.hSet("values", index, "Nothing yet!");
  // so this is why we created dulicate redis object to publish insert event which will then handle worker
  await redisPublisher.publish("insert", index);

  pgClient.query("INSERT INTO my_values(number) VALUES($1)", [index]);

  res.send({ working: true });
});

app.listen(5000, (err) => {
  console.log("Listening on port 5000!");
});
