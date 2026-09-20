/** JS twin of commandQueryGateway.ts for Node tests / host bridge */
let backend = null;

export function setGatewayBackend(next) {
  backend = next;
}

export function getGatewayBackend() {
  return backend;
}

function toFailure(error) {
  const e = error || {};
  const message = e.message || String(error);
  const code = e.code || (typeof message === "string" ? message.split(":")[0] : "APPLICATION_ERROR");
  return { ok: false, code, message };
}

export function createBrowserGateway(_edition = "full") {
  return {
    async execute(id, input) {
      if (!backend) {
        return {
          ok: false,
          code: "HOST_BRIDGE_UNWIRED",
          message: `"${id}" awaits PersistenceProvider / setGatewayBackend.`,
        };
      }
      try {
        return await backend(id, input);
      } catch (error) {
        return toFailure(error);
      }
    },
  };
}
