// Emissor mínimo de eventos de sessão. O httpClient dispara `sessionExpired`
// quando a API responde 401; a camada de apresentação assina para forçar logout.
type Listener = () => void;

const listeners = new Set<Listener>();

export const sessionEvents = {
  onSessionExpired(listener: Listener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  emitSessionExpired(): void {
    listeners.forEach((listener) => listener());
  },
};
