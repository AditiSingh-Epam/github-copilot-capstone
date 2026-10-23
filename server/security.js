const allowedLoopbackHosts = new Set(["127.0.0.1", "localhost", "[::1]"]);

export function createLocalOriginGuard(allowedOrigin) {
  const expectedOrigin = new URL(allowedOrigin);
  const expectedHost = expectedOrigin.host.toLowerCase();

  return function localOriginGuard(request, response, next) {
    const requestHost = request.headers.host?.toLowerCase();
    if (
      !requestHost ||
      requestHost !== expectedHost ||
      !allowedLoopbackHosts.has(expectedOrigin.hostname.toLowerCase())
    ) {
      return response.status(403).json({ error: { message: "Forbidden" } });
    }

    const origin = request.get("Origin");
    if (origin !== undefined && origin !== expectedOrigin.origin) {
      return response.status(403).json({ error: { message: "Forbidden" } });
    }

    if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) {
      if (origin !== expectedOrigin.origin) {
        return response.status(403).json({ error: { message: "Forbidden" } });
      }

      const contentType = request.get("Content-Type")?.split(";")[0].trim().toLowerCase();
      if (contentType !== "application/json") {
        return response.status(415).json({
          error: { message: "Content-Type must be application/json." },
        });
      }
    }

    return next();
  };
}
