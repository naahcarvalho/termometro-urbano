import { useState } from "react";
import "./App.css";

function App() {
  const [cidade, setCidade] = useState("");
  const [temperatura, setTemperatura] = useState<number | null>(null);
  const [erro, setErro] = useState("");
  const [historico, setHistorico] = useState<string[]>([]);
  const [previsao, setPrevisao] = useState<{
    min: number[];
    max: number[];
    dias: string[];
  } | null>(null);
  const [icone, setIcone] = useState<string>("");

  const weatherIcons: Record<number, string> = {
    0: "☀️",
    1: "🌤️",
    2: "☁️",
    3: "🌧️",
    45: "🌫️",
    61: "🌦️",
    80: "🌧️",
  };

  const buscarClima = async () => {
    if (!cidade) return;

    const cacheKey = `clima-${cidade.toLowerCase()}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const dados = JSON.parse(cached);
      setTemperatura(dados.temperatura);
      setPrevisao(dados.previsao);
      setIcone(dados.icone);
      setErro("");
      setHistorico((prev) => [...new Set([cidade, ...prev])]);
      return;
    }

    try {
      setErro("");
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
          cidade
        )}`
      );
      const geoData = await geoRes.json();

      if (!geoData.results || geoData.results.length === 0) {
        setErro("Cidade não encontrada");
        setTemperatura(null);
        setPrevisao(null);
        return;
      }

      const { latitude, longitude } = geoData.results[0];

      const climaRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&daily=temperature_2m_min,temperature_2m_max&timezone=auto`
      );
      const climaData = await climaRes.json();

      const temp = climaData.current_weather?.temperature ?? null;
      const iconCode = climaData.current_weather?.weathercode ?? 0;
      const iconeClima = weatherIcons[iconCode] || "🌡️";

      const previsaoDias = {
        min: climaData.daily.temperature_2m_min,
        max: climaData.daily.temperature_2m_max,
        dias: climaData.daily.time,
      };

      setTemperatura(temp);
      setIcone(iconeClima);
      setPrevisao(previsaoDias);
      setHistorico((prev) => [...new Set([cidade, ...prev])]);

      localStorage.setItem(
        cacheKey,
        JSON.stringify({
          temperatura: temp,
          previsao: previsaoDias,
          icone: iconeClima,
        })
      );
    } catch (erro) {
      console.log("Erro ao buscar clima:", erro);
      setErro("Ocorreu um erro ao buscar o clima");
      setTemperatura(null);
      setPrevisao(null);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-clima backdrop-brightness-75">
      <div className="p-8 rounded shadow-md w-80 text-center bg-white/30">
        <h1 className="text-2xl text-purple-600 font-bold font-marko mb-4">
          Termômetro Urbano
        </h1>
        <p className="text-purple-300 mb-4">
          Veja a temperatura atual em qualquer cidade
        </p>

        <input
          type="text"
          placeholder="Digite a cidade"
          value={cidade}
          onChange={(e) => setCidade(e.target.value)}
          className="border-2 border-purple-500 rounded-full px-3 py-2 mb-4 w-full focus:outline-none focus:ring-2 focus:ring-purple-300"
        />
        <button
          onClick={buscarClima}
          className="bg-purple-600 text-white px-4 py-2 mb-4 rounded-full hover:bg-purple-700 transition-colors"
        >
          Buscar
        </button>

        {erro && <p className="text-red-500 mb-2">{erro}</p>}

        {temperatura !== null && (
          <div className="text-white text-lg">
            <p>
              Temperatura atual em {cidade}: {temperatura}°C {icone}
            </p>
          </div>
        )}

        {previsao && (
          <div className="mt-4 text-white text-sm">
            <p className="font-bold mb-1">Previsão para os próximos dias:</p>
            {previsao.dias.map((dia, i) => (
              <p key={dia}>
                {dia}: {previsao.min[i]}°C - {previsao.max[i]}°C
              </p>
            ))}
          </div>
        )}

        {historico.length > 0 && (
          <div className="mt-4 text-left text-sm text-white">
            <p className="font-bold mb-1">Histórico de buscas:</p>
            <ul className="list-disc list-inside">
              {historico.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
