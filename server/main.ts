import { Application, Router } from "https://deno.land/x/oak/mod.ts";
import { exists } from "https://deno.land/std/fs/mod.ts";

interface ServiceUrl {
  id: string;
  url: string;
  status?: string;
  lastPing?: string;
}

interface Service {
  id: string;
  name: string;
  urls: ServiceUrl[];
}

const isProduction = Deno.env.get("DENO_ENV") === "production";

const STORAGE_FILE = "./data/services_storage.json";

// Helper functions for data persistence
async function loadServices(): Promise<Service[]> {
  if (await exists(STORAGE_FILE)) {
    const content = await Deno.readTextFile(STORAGE_FILE);
    return JSON.parse(content);
  }
  return [];
}

async function saveServices(services: Service[]): Promise<void> {
  await Deno.writeTextFile(STORAGE_FILE, JSON.stringify(services, null, 2));
}

const app = new Application();
const router = new Router();

// CORS middleware
app.use(async (ctx, next) => {
  ctx.response.headers.set("Access-Control-Allow-Origin", "*");
  ctx.response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, DELETE, OPTIONS",
  );
  ctx.response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization",
  );

  if (ctx.request.method === "OPTIONS") {
    ctx.response.status = 200;
    return;
  }

  await next();
});

if (isProduction) {
  // Serve static files in production only
  app.use(async (ctx, next) => {
    try {
      await ctx.send({
        root: `${Deno.cwd()}/client/dist`,
        index: "index.html",
      });
    } catch {
      await next();
    }
  });
}

// Get all services
router.get("/api/services", async (ctx) => {
  const services = await loadServices();
  ctx.response.body = services;
});

// Create new service
router.post("/api/services", async (ctx) => {
  const body = await ctx.request.body.json();
  console.log(body);
  if (!body.name || !body.urls || !Array.isArray(body.urls)) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Name and URLs array are required" };
    return;
  }

  const services = await loadServices();
  const newService: Service = {
    id: crypto.randomUUID(),
    name: body.name,
    urls: body.urls.map((urlObj: string) => ({
      id: crypto.randomUUID(),
      url: urlObj,
      status: "UNKNOWN",
      lastPing: null,
    })),
  };

  services.push(newService);
  await saveServices(services);

  ctx.response.status = 201;
  ctx.response.body = newService;
});

// Delete service
router.delete("/api/services/:id", async (ctx) => {
  const id = ctx.params.id;
  const services = await loadServices();
  const filteredServices = services.filter((s) => s.id !== id);

  if (filteredServices.length === services.length) {
    ctx.response.status = 404;
    ctx.response.body = { error: "Service not found" };
    return;
  }

  await saveServices(filteredServices);
  ctx.response.status = 204;
});

// Add new URL to existing service
router.post("/api/services/:id/urls", async (ctx) => {
  const id = ctx.params.id;
  const body = await ctx.request.body.json();

  if (!body.url) {
    ctx.response.status = 400;
    ctx.response.body = { error: "URL is required" };
    return;
  }

  const services = await loadServices();
  const service = services.find((s) => s.id === id);

  if (!service) {
    ctx.response.status = 404;
    ctx.response.body = { error: "Service not found" };
    return;
  }

  const newUrl: ServiceUrl = {
    id: crypto.randomUUID(),
    url: body.url,
    status: "UNKNOWN",
    lastPing: null,
  };

  service.urls.push(newUrl);
  await saveServices(services);

  ctx.response.body = newUrl;
});

// Delete specific URL from service
router.delete("/api/services/:id/urls/:urlId", async (ctx) => {
  const { id, urlId } = ctx.params;
  const services = await loadServices();
  const service = services.find((s) => s.id === id);

  if (!service) {
    ctx.response.status = 404;
    ctx.response.body = { error: "Service not found" };
    return;
  }

  const initialLength = service.urls.length;
  service.urls = service.urls.filter((u) => u.id !== urlId);

  if (service.urls.length === initialLength) {
    ctx.response.status = 404;
    ctx.response.body = { error: "URL not found" };
    return;
  }

  await saveServices(services);
  ctx.response.status = 204;
});

// Ping specific URL
router.post("/api/services/:id/urls/:urlId/ping", async (ctx) => {
  const { id, urlId } = ctx.params;
  const services = await loadServices();
  const service = services.find((s) => s.id === id);

  if (!service) {
    ctx.response.status = 404;
    ctx.response.body = { error: "Service not found" };
    return;
  }

  const urlEntry = service.urls.find((u) => u.id === urlId);
  if (!urlEntry) {
    ctx.response.status = 404;
    ctx.response.body = { error: "URL not found" };
    return;
  }

  try {
    const timeNow = new Date().toISOString();
    const response = await fetch(urlEntry.url, { method: "GET" });

    if (response.ok) {
      urlEntry.status = `ALIVE@${timeNow}`;
    } else {
      urlEntry.status = `DEAD@${timeNow}`;
    }
  } catch (error) {
    urlEntry.status = `DEAD@${new Date().toISOString()}`;
  }

  urlEntry.lastPing = new Date().toISOString();
  await saveServices(services);

  // Return the entire service instead of just the urlEntry
  ctx.response.body = service;
});

// Setup routes and start server
app.use(router.routes());
app.use(router.allowedMethods());

const port = 8000;
console.log(`Server running on http://localhost:${port}`);

await app.listen({ port });
