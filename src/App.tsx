import { useRef, useState } from "react";
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
  const [view, setView] = useState<"home" | "resultado">("home");

  const scrollRef = useRef<HTMLDivElement>(null);

  const weatherIcons: Record<number, string> = {
    0: "☀️",
    1: "🌤️",
    2: "☁️",
    3: "🌧️",
    45: "🌫️",
    61: "🌦️",
    80: "🌧️",
  };

  const formatarData = (isoDate: string) => {
    const data = new Date(isoDate);
    const dia = String(data.getDate()).padStart(2, "0");
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const ano = data.getFullYear();
    return `${dia}-${mes}-${ano}`;
  };

  const buscarClima = async () => {
    if (!cidade) return;

    const cacheKey = `clima-${cidade.toLowerCase()}`;

    const atualizarEstado = (
      temp: number | null,
      previsaoData: typeof previsao,
      iconeClima: string,
      erroMsg = ""
    ) => {
      setTemperatura(temp);
      setPrevisao(previsaoData);
      setIcone(iconeClima);
      setErro(erroMsg);
      setHistorico((prev) => [...new Set([cidade, ...prev])]);
      if (!erroMsg)
        localStorage.setItem(
          cacheKey,
          JSON.stringify({ temperatura: temp, previsao: previsaoData, icone: iconeClima })
        );
      setView(erroMsg ? "home" : "resultado");
    };

    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const dados = JSON.parse(cached);
      atualizarEstado(dados.temperatura, dados.previsao, dados.icone);
      return;
    }

    try {
      setErro("");

      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cidade)}`
      );
      const geoData = await geoRes.json();

      if (!geoData.results || geoData.results.length === 0) {
        atualizarEstado(null, null, "", "Cidade não encontrada");
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

      atualizarEstado(temp, previsaoDias, iconeClima);
    } catch (err) {
      console.log("Erro ao buscar clima:", err);
      atualizarEstado(null, null, "", "Ocorreu um erro ao buscar o clima");
    }
  };

  if (view === "home") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-clima px-4">
        <div className="backdrop-blur-2xl bg-white/25 rounded-3xl p-16 w-full max-w-md text-center shadow-lg animate-fadeIn">
          <h1 className="text-4xl font-extrabold mb-6 text-pink-700 drop-shadow-lg">
            Termômetro Urbano 🌆
          </h1>
          <input
            type="text"
            placeholder="Digite a cidade"
            value={cidade}
            onChange={(e) => setCidade(e.target.value)}
            className="border-2 border-pink-400 bg-white/20 text-gray-800 placeholder-pink-400 rounded-full px-4 py-2 mb-6 w-full focus:outline-none focus:ring-2 focus:ring-pink-300 transition-all"
          />
          <button
            onClick={buscarClima}
            className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-pink-400/50 transition-all duration-300 cursor-pointer"
          >
            Buscar
          </button>
          {erro && (
            <p data-testid="erro-clima" className="text-red-500 mt-4">
              {erro}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-clima px-4">
      <div className="backdrop-blur-2xl bg-white/25 rounded-3xl p-12 w-full max-w-4xl shadow-lg animate-fadeIn">
        {/* Temperatura atual */}
        {temperatura !== null && (
          <div className="bg-pink-100/50 rounded-xl p-6 mb-6 flex items-center justify-center gap-4 shadow-md animate-fadeInUp">
            <span className="text-4xl">{icone}</span>
            <p className="text-2xl font-bold text-pink-800">
              {temperatura}°C em {cidade}
            </p>
          </div>
        )}

        {/* Previsão */}
        {previsao && (
          <div className="mb-6 relative flex items-center">
            <button
              onClick={() =>
                scrollRef.current?.scrollBy({ left: -150, behavior: "smooth" })
              }
              className="absolute left-0 z-10 bg-white/70 rounded-full p-3 shadow-md hover:bg-white transition cursor-pointer"
            >
              &#8249;
            </button>

            <div
              ref={scrollRef}
              className="flex overflow-x-hidden gap-4 scroll-smooth no-scrollbar px-10"
            >
              {previsao.dias.map((dia, i) => (
                <div
                  key={dia}
                  className="min-w-[140px] bg-pink-100/50 rounded-xl p-4 text-center shadow-md hover:scale-105 transform transition-all duration-300 flex-shrink-0"
                >
                  <p className="font-semibold text-gray-900 mb-2">
                    {formatarData(dia)}
                  </p>
                  <p className="text-gray-700 mb-1">
                    <span className="text-pink-600 font-semibold">Min:</span>{" "}
                    {previsao.min[i]}°C
                  </p>
                  <p className="text-gray-700">
                    <span className="text-purple-600 font-semibold">Max:</span>{" "}
                    {previsao.max[i]}°C
                  </p>
                </div>
              ))}
            </div>

            <button
              onClick={() =>
                scrollRef.current?.scrollBy({ left: 150, behavior: "smooth" })
              }
              className="absolute right-0 z-10 bg-white/70 rounded-full p-3 shadow-md hover:bg-white transition cursor-pointer"
            >
              &#8250;
            </button>
          </div>
        )}

        {/* Histórico */}
        {historico.length > 0 && (
          <div className="mb-6">
            <p className="font-bold text-pink-700 mb-2">Histórico de buscas:</p>
            <div className="flex flex-wrap gap-2">
              {historico.map((c, i) => (
                <span
                  key={i}
                  className="bg-pink-200/50 text-gray-900 px-3 py-1 rounded-full shadow-sm cursor-pointer hover:bg-pink-300/70 transition-all"
                  onClick={() => {
                    setCidade(c);
                    buscarClima();
                  }}
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Botão voltar */}
        <div className="flex justify-center">
          <button
            onClick={() => setView("home")}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-2 px-6 rounded-full shadow-lg hover:shadow-pink-400/50 transition-all duration-300 cursor-pointer"
          >
            Voltar
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
