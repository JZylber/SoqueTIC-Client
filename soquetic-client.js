class SoqueticError extends Error {
  constructor(message) {
    super(message);
    this.name = "SoqueticError";
  }
}

const socket = io("http://localhost:3000", {
  autoConnect: false,
});

socket.on("connect", () => {
  console.log("¡Conectado al backend!");
});

socket.on("connect_error", () => {
  throw new SoqueticError(
    "Error al conectar al backend. Revisá que el servidor no haya crasheado y esté corriendo en el puerto correcto.\nRecargá la página para reconectar."
  );
});

socket.on("disconnect", () => {
  throw new SoqueticError(
    "Te desconectaste del backend. Revisá que el servidor esté corriendo sin errores y recargá la página para reconectar."
  );
});

const assertConnection = (socket) => {
  if (!socket.active) {
    throw new SoqueticError(
      "No se puede enviar un evento si no hay conexión al backend.\nRecordá que tenés que llamar a connect2Server() para conectarte al backend."
    );
  }
};

const assertTypeIsString = (type) => {
  if (typeof type !== "string") {
    throw new SoqueticError(
      `El nombre del evento debe ser un string, pero es de tipo ${typeof type}`
    );
  }
};

const assertCallbackIsFunction = (callback) => {
  if (typeof callback !== "function") {
    throw new SoqueticError(
      `El callback debe ser una función, pero es de tipo ${typeof callback}`
    );
  }
};

const decodeQueryString = (queryString) => {
  const params = new URLSearchParams(queryString);
  const decoded = {};
  for (const [key, value] of params.entries()) {
    decoded[key] = decodeURIComponent(value);
  }
  return Object.keys(decoded).length > 0 ? decoded : undefined;
};

const RESTCallbackDecorator = (callback) => {
  assertCallbackIsFunction(callback);
  return (response) => {
    if (response.status !== 200) {
      throw new SoqueticError(
        response.message ? response.message : "Error desconocido"
      );
    }
    callback(response.data);
  };
};

const subscribeRealTimeEvent = (event, callback) => {
  assertConnection(socket);
  assertTypeIsString(event);
  socket.on(`RT:${event}`, (data) => {
    return callback(data);
  });
};

const getEvent = (event, callback) => {
  assertConnection(socket);
  assertTypeIsString(event);
  const [type, ...rest] = event.split("?");
  const queryString = rest.join("?");
  const decodedQuery = decodeQueryString(queryString);
  payload = { query: decodedQuery };
  socket.emit(`GET:${type}`, payload, RESTCallbackDecorator(callback));
};

const postEvent = (event, data, callback = () => {}) => {
  assertConnection(socket);
  assertTypeIsString(event);
  const [type, ...rest] = event.split("?");
  const queryString = rest.join("?");
  const decodedQuery = decodeQueryString(queryString);
  payload = { data, query: decodedQuery };
  socket.emit(`POST:${type}`, payload, RESTCallbackDecorator(callback));
};

const connect2Server = (PORT = 3000) => {
  socket.io.uri = `http://localhost:${PORT}`;
  socket.connect();
};
