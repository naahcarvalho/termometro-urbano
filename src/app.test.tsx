import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

// Mock global fetch
global.fetch = jest.fn();

beforeEach(() => {
  (fetch as jest.Mock).mockClear();
});

test("exibe temperatura para cidade válida", async () => {
  (fetch as jest.Mock)
    // Mock da API de Geocodificação
    .mockResolvedValueOnce({
      json: async () => ({
        results: [{ latitude: -23.5505, longitude: -46.6333 }],
      }),
    })
    // Mock da API de Clima
    .mockResolvedValueOnce({
      json: async () => ({
        current_weather: { temperature: 25, windspeed: 10, winddirection: 90 },
      }),
    });

  render(<App />);
  const input = screen.getByPlaceholderText("Digite a cidade");
  const button = screen.getByText("Buscar");

  userEvent.type(input, "São Paulo");
  userEvent.click(button);

  await waitFor(() =>
    expect(
      screen.getByText(/Temperatura atual em São Paulo: 25°C/i)
    ).toBeInTheDocument()
  );
});

test("exibe erro quando cidade não existe", async () => {
  (fetch as jest.Mock).mockResolvedValueOnce({
    json: async () => ({ results: [] }),
  });

  render(<App />);
  const input = screen.getByPlaceholderText("Digite a cidade");
  const button = screen.getByText("Buscar");

  userEvent.type(input, "CidadeInexistente");
  userEvent.click(button);

  await waitFor(() =>
    expect(screen.getByText(/Cidade não encontrada/i)).toBeInTheDocument()
  );
});

test("não faz busca se o input estiver vazio", () => {
  render(<App />);
  const button = screen.getByText("Buscar");

  userEvent.click(button);

  expect(fetch).not.toHaveBeenCalled();
});

test("exibe mensagem de erro quando a API falha", async () => {
  (fetch as jest.Mock).mockRejectedValueOnce(new Error("Falha na API"));

  render(<App />);
  const input = screen.getByPlaceholderText("Digite a cidade");
  const button = screen.getByText("Buscar");

  userEvent.type(input, "São Paulo");
  userEvent.click(button);

  await waitFor(() =>
    expect(
      screen.getByText(/Ocorreu um erro ao buscar o clima/i)
    ).toBeInTheDocument()
  );
});
