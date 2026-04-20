import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Save, 
  Info,
  DollarSign,
  Percent,
  Warehouse
} from 'lucide-react';
import { getGlobalSettings, updateGlobalSettings } from '../firebase/firestore';
import { toast } from 'react-hot-toast';

const SettingsPage = () => {
  const [settings, setSettings] = useState({
    shopName: 'SmartPOS',
    taxRate: 8,
    currency: 'LKR',
    address: '',
    phone: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await getGlobalSettings();
        // Merge with initial state to ensure no undefined fields (uncontrolled inputs)
        setSettings(prev => ({ ...prev, ...data }));
      } catch {
        toast.error("Failed to load settings");
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Ensure taxRate is a valid number before saving
      const finalSettings = {
        ...settings,
        taxRate: isNaN(settings.taxRate) ? 0 : settings.taxRate
      };
      await updateGlobalSettings(finalSettings);
      toast.success("Settings updated successfully! Please refresh to apply all changes.");
    } catch (error) {
      console.error("SettingsPage Error:", error);
      toast.error(`Failed to save settings: ${error.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto h-screen overflow-y-auto custom-scrollbar">
      <div className="flex items-center gap-4 mb-10">
        <div className="p-4 bg-indigo-600 rounded-3xl shadow-xl shadow-indigo-600/20">
          <SettingsIcon className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">System Settings</h1>
          <p className="text-slate-500 font-medium mt-1">Configure global pricing and identity.</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-8 pb-12">
        {/* Business Identity */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
          <div className="flex items-center gap-3 mb-8">
            <Warehouse className="h-6 w-6 text-indigo-500" />
            <h3 className="text-xl font-bold text-slate-900">Business Identity</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-slate-400 tracking-wider">Shop Name</label>
              <input 
                type="text" 
                className="w-full px-5 py-4 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 transition-all outline-none font-bold text-slate-700"
                value={settings.shopName || ''}
                onChange={(e) => setSettings({...settings, shopName: e.target.value})}
                placeholder="e.g. My Awesome Shop"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-slate-400 tracking-wider">Phone Number</label>
              <input 
                type="text" 
                className="w-full px-5 py-4 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 transition-all outline-none font-bold text-slate-700"
                value={settings.phone || ''}
                onChange={(e) => setSettings({...settings, phone: e.target.value})}
                placeholder="+94 77 123 4567"
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-black uppercase text-slate-400 tracking-wider">Shop Address</label>
              <textarea 
                className="w-full px-5 py-4 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 transition-all outline-none font-bold text-slate-700 h-24 resize-none"
                value={settings.address || ''}
                onChange={(e) => setSettings({...settings, address: e.target.value})}
                placeholder="123 Galle Road, Colombo 03"
              />
            </div>
          </div>
        </div>

        {/* Financial Configuration */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
          <div className="flex items-center gap-3 mb-8">
            <DollarSign className="h-6 w-6 text-emerald-500" />
            <h3 className="text-xl font-bold text-slate-900">Financial Configuration</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center justify-between">
                Global Tax Rate (%)
                <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Required</span>
              </label>
              <div className="relative">
                <input 
                  type="number" 
                  step="0.01"
                  className="w-full px-5 py-4 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 transition-all outline-none font-black text-slate-700 pr-12"
                  value={isNaN(settings.taxRate) ? '' : settings.taxRate}
                  onChange={(e) => {
                    const val = e.target.value === '' ? NaN : parseFloat(e.target.value);
                    setSettings({...settings, taxRate: val});
                  }}
                />
                <Percent className="absolute right-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
              </div>
            </div>
            
            <div className="space-y-2 opacity-60">
              <label className="text-xs font-black uppercase text-slate-400 tracking-wider">Base Currency</label>
              <input 
                type="text" 
                readOnly
                className="w-full px-5 py-4 bg-slate-100 border border-transparent rounded-2xl outline-none font-black text-slate-500 cursor-not-allowed"
                value="LKR (Sri Lankan Rupee)"
              />
            </div>
          </div>

          <div className="mt-8 p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-4">
            <Info className="h-6 w-6 text-amber-600 flex-shrink-0" />
            <p className="text-xs text-amber-700 font-medium leading-relaxed">
              Changing the tax rate will affect all new transactions immediately. Previous orders will retain the tax rate they were processed with.
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-3 px-10 py-5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-600/30 transition-all active:scale-95 disabled:opacity-70 disabled:active:scale-100"
          >
            {saving ? (
              <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Save className="h-5 w-5" />
                Apply Global Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SettingsPage;
