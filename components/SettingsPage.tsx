import React, { useState, useEffect } from 'react';
import { ApiConfig, ExchangeID, MarketType } from '../types';
import { Shield, CheckCircle, AlertTriangle, Eye, EyeOff, Layers, KeyRound } from 'lucide-react';

interface SettingsPageProps {
  onSave: (config: ApiConfig) => void;
  currentConfig: ApiConfig | null;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ onSave, currentConfig }) => {
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [isTestnet, setIsTestnet] = useState(false);
  const [marketType, setMarketType] = useState<MarketType>(MarketType.FUTURES);
  const [showSecret, setShowSecret] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [status, setStatus] = useState<'IDLE' | 'VERIFYING' | 'SUCCESS' | 'ERROR'>('IDLE');

  useEffect(() => {
    if (currentConfig) {
      setApiKey(currentConfig.apiKey);
      setApiSecret(currentConfig.apiSecret);
      setIsTestnet(currentConfig.isTestnet);
      setMarketType(currentConfig.marketType || MarketType.FUTURES);
      setGeminiApiKey(currentConfig.geminiApiKey || '');
    }
  }, [currentConfig]);

  const handleVerifyAndSave = () => {
    setStatus('VERIFYING');
    setTimeout(() => {
      if (apiKey.length < 10 || apiSecret.length < 10) {
        setStatus('ERROR');
      } else {
        setStatus('SUCCESS');
        onSave({
          apiKey,
          apiSecret,
          geminiApiKey,
          isTestnet,
          marketType,
          exchange: ExchangeID.BINANCE
        });
      }
    }, 1000);
  };

  return (
    <div className="flex-1 p-8 max-w-4xl mx-auto animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-2xl font-bold font-mono text-white mb-2 flex items-center gap-3">
          <Shield className="text-primary-500" />
          Konfigurasi Koneksi API
        </h1>
        <p className="text-gray-400">Hubungkan Nexus AI ke Binance dan masukkan API Gemini secara manual.</p>
      </div>

      <div className="glass-panel rounded-xl p-8 space-y-6">
        
        {/* Exchange Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Exchange</label>
          <div className="flex gap-4">
            <button className="px-4 py-2 bg-primary-600/20 border border-primary-500 text-primary-400 rounded-lg font-mono text-sm">BINANCE</button>
            <button className="px-4 py-2 bg-gray-800 border border-gray-700 text-gray-500 rounded-lg font-mono text-sm cursor-not-allowed">OKX (Coming Soon)</button>
          </div>
        </div>

        {/* Market Type Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Tipe Pasar (Market)</label>
          <div className="flex gap-4">
            <button 
                onClick={() => setMarketType(MarketType.SPOT)}
                className={`px-4 py-2 border rounded-lg font-mono text-sm flex items-center gap-2 transition-all ${marketType === MarketType.SPOT ? 'bg-primary-600 border-primary-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400'}`}
            >
                <Layers size={16}/> SPOT (Kepemilikan Aset)
            </button>
            <button 
                onClick={() => setMarketType(MarketType.FUTURES)}
                className={`px-4 py-2 border rounded-lg font-mono text-sm flex items-center gap-2 transition-all ${marketType === MarketType.FUTURES ? 'bg-primary-600 border-primary-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400'}`}
            >
                <Layers size={16}/> FUTURES (Perpetual/Derivatif)
            </button>
          </div>
        </div>

        {/* API Key */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">API Key</label>
          <input 
            type="text" 
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 text-white font-mono focus:border-primary-500 focus:outline-none transition-colors"
            placeholder="Masukkan Binance API Key"
          />
        </div>

        {/* API Secret */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">API Secret</label>
          <div className="relative">
            <input 
              type={showSecret ? "text" : "password"} 
              value={apiSecret}
              onChange={(e) => setApiSecret(e.target.value)}
              className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 text-white font-mono focus:border-primary-500 focus:outline-none transition-colors"
              placeholder="Masukkan Binance API Secret"
            />
            <button 
              onClick={() => setShowSecret(!showSecret)}
              className="absolute right-3 top-3 text-gray-500 hover:text-white"
            >
              {showSecret ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Gemini API Key */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Gemini API Key</label>
          <input 
            type="text" 
            value={geminiApiKey}
            onChange={(e) => setGeminiApiKey(e.target.value)}
            className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 text-white font-mono focus:border-primary-500 focus:outline-none transition-colors"
            placeholder="Masukkan Gemini API Key (opsional)"
          />
          <p className="mt-2 text-xs text-gray-500 flex items-center gap-2">
            <KeyRound size={12} />
            Disimpan lokal di browser agar analisis AI aktif.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-800">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <h3 className="text-white font-medium">Testnet Environment</h3>
                <p className="text-xs text-gray-500">Gunakan sandbox Binance (Uang Virtual).</p>
              </div>
              <button 
                onClick={() => setIsTestnet(!isTestnet)}
                className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${isTestnet ? 'bg-accent-green' : 'bg-gray-700'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${isTestnet ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1">
                <h3 className="text-white font-medium">Proxy Lokal Vite</h3>
                <p className="text-xs text-gray-500">Permintaan Binance diteruskan oleh Vite dev server.</p>
              </div>
            </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-800">
           <div className="flex items-center gap-2">
             {status === 'SUCCESS' && <span className="flex items-center gap-2 text-accent-green text-sm font-bold"><CheckCircle size={16}/> Config Saved</span>}
             {status === 'ERROR' && <span className="flex items-center gap-2 text-accent-red text-sm font-bold"><AlertTriangle size={16}/> Invalid Keys</span>}
           </div>

           <button 
             onClick={handleVerifyAndSave}
             disabled={status === 'VERIFYING'}
             className="bg-primary-600 hover:bg-primary-500 text-white font-bold py-3 px-8 rounded-lg shadow-lg shadow-primary-600/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
           >
             {status === 'VERIFYING' ? 'Memverifikasi...' : 'Simpan & Hubungkan'}
           </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
