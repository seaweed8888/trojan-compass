import { app } from "./app.js";
import { env } from "./config/env.js";

app.listen(env.port, env.host, () => {
  console.log(`Trojan Compass API: http://${env.host}:${env.port}/api/health`);
});
