"use strict";

const Hapi = require("@hapi/hapi");
const routes = require("./routes");
const dotenv = require("dotenv");
const MongoDB = require("hapi-mongodb");

const init = async () => {
  dotenv.config();
  const server = Hapi.server({
    port: process.env.PORT || 10000,
    host: "0.0.0.0",
    routes: {
      cors: true,
    },
  });
  const url = process.env.DB_URL + process.env.DB_NAME;

  // Retry logic for MongoDB connection
  async function connectWithRetry(server, options, retries = 5, delay = 15000) {
    for (let i = 0; i < retries; i++) {
      try {
        await server.register({
          plugin: MongoDB,
          options,
        });
        return; // Success!
      } catch (err) {
        if (i === retries - 1) throw err;
        console.log(
          `MongoDB connection failed, retrying in ${delay / 1000}s...`
        );
        await new Promise((res) => setTimeout(res, delay));
      }
    }
  }

  await connectWithRetry(server, {
    url,
    decorate: true,
  });

  await server.register([
    {
      plugin: require("@hapi/inert"),
      options: {},
    },
    {
      plugin: require("hapi-pino"),
      options: {
        logEvents: ["response", "onPostStart"],
      },
    },
  ]);

  server.route({
    method: "GET",
    path: "/",
    handler: (request, h) => {
      return "Welcome to Kanbaneon API server";
    },
  });
  server.route(routes);

  await server.start();
  console.log(`Server running at: ${server.info.uri}`);
};

process.on("unhandledRejection", (err) => {
  console.log(err);
  process.exit(1);
});

init();
