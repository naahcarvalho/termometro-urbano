import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

beforeEach(() => {
  (global.fetch as jest.Mock).mockClear();
});

// Mock global fetch
global.fetch = jest.fn();

test("exibe temperatura para cidade válida", async () => {
  (global.fetch as jest.Mock)
    .mockResolvedValueOnce({
      json: async () => ({
        results: [{ latitude: -23.5505, longitude: -46.6333 }],
      }),
    })
    .mockResolvedValueOnce({
      json: async () => ({
        current_weather: { temperature: 25, weathercode: 0 },
        daily: {
          temperature_2m_min: [20],
          temperature_2m_max: [25],
          time: ["2025-08-30"],
        },
      }),
    });

  render(<App />);
  const input = screen.getByPlaceholderText("Digite a cidade");
  const button = screen.getByText("Buscar");

  await userEvent.type(input, "São Paulo");
  await userEvent.click(button);

  await waitFor(() =>
    expect(screen.getByText(/25°C em São Paulo/i)).toBeInTheDocument()
  );
});

test("exibe erro quando cidade não existe", async () => {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    json: async () => ({ results: [] }),
  });

  render(<App />);
  const input = screen.getByPlaceholderText("Digite a cidade");
  const button = screen.getByText("Buscar");

  await userEvent.type(input, "CidadeInexistente");
  await userEvent.click(button);

  await waitFor(() =>
    expect(screen.getByText(/Cidade não encontrada/i)).toBeInTheDocument()
  );
});

test("não faz busca se o input estiver vazio", () => {
  render(<App />);
  const button = screen.getByText("Buscar");

  userEvent.click(button);

  expect(global.fetch).not.toHaveBeenCalled();
});
