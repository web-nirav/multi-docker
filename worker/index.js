const keys = require("./keys");
const { createClient } = require("redis");

const redisClient = createClient({
  url: `redis://${keys.redisHost}:${keys.redisPort}`,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 20) return new Error("Too many retries, giving up");
      return Math.min(retries * 50, 2000);
    },
  },
});

redisClient.on("error", (err) => console.error("Redis Client Error", err));

// Worker-side Redis setup using modern async/await syntax
async function start() {
  await redisClient.connect();

  const sub = redisClient.duplicate();
  await sub.connect();

  function fib(index) {
    if (index < 2) return 1;
    return fib(index - 1) + fib(index - 2);
  }

  // message here is the new indice that gets stored in redis which is given by user
  // so we will check for that and store hash set of value calculate fib series value and store it on same indice key
  // subscrube to insert event, so anytime soneone insert new value to redis
  // ✅ Correct way in Redis v4+
  await sub.subscribe("insert", async (message) => {
    await redisClient.hSet("values", message, fib(parseInt(message)));
  });

  console.log("Worker subscribed to 'insert' channel");
}

start().catch(console.error);
