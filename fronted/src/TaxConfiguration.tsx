import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from './config/api';

interface TaxAuthority {
  id: string;
  name: string;
  country?: string;
  registrationNumber?: string;
}

interface TaxRate {
  id: string;
  taxCodeId: string;
  percentage: number;
  effectiveFrom: string;
  effectiveTo?: string;
}

interface TaxCode {
  id: string;
  code: string;
  name: string;
  description?: string;
  taxAuthorityId: string;
  rates: TaxRate[];
  isActive: boolean;
}

export const TaxConfiguration: React.FC = () => {
  const [authorities, setAuthorities] = useState<TaxAuthority[]>([]);
  const [codes, setCodes] = useState<TaxCode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [authRes, codesRes] = await Promise.all([
        fetch(`${API_BASE_URL.replace(/\/v1$/, '')}/taxes/authorities`),
        fetch(`${API_BASE_URL.replace(/\/v1$/, '')}/taxes/codes`)
      ]);
      setAuthorities(await authRes.json());
      setCodes(await codesRes.json());
    } catch (e) {
      console.error("Error fetching taxes", e);
    }
    setLoading(false);
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading global tax configurations...</div>;

  return (
    <div className="p-8 max-w-[1200px] mx-auto animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Tax Configuration</h1>
          <p className="text-gray-500 mt-1">Manage global tax authorities, VAT, GST, and Sales Tax codes</p>
        </div>
        <button className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl shadow-sm shadow-blue-600/20 transition-all active:scale-95">
          + New Tax Code
        </button>
      </div>

      <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 mb-8 flex gap-3 text-sm text-blue-800">
        <span className="text-blue-500">🌍</span>
        <p><strong>Global Compliance Active:</strong> Default tax codes have been seeded for UK (HMRC), US (IRS), Canada (CRA), UAE (FTA), Saudi Arabia (ZATCA), and Pakistan (FBR).</p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Tax Authorities</h2>
          </div>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-gray-400 bg-gray-50/50">
                <th className="py-3 px-6 font-medium">Authority Name</th>
                <th className="py-3 px-6 font-medium">Country</th>
                <th className="py-3 px-6 font-medium">Registration No.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {authorities.map(auth => (
                <tr key={auth.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 px-6 font-medium text-gray-900">{auth.name}</td>
                  <td className="py-4 px-6 text-gray-500">{auth.country || 'N/A'}</td>
                  <td className="py-4 px-6 text-gray-500">{auth.registrationNumber || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Tax Codes & Rates</h2>
          </div>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-gray-400 bg-gray-50/50">
                <th className="py-3 px-6 font-medium">Code</th>
                <th className="py-3 px-6 font-medium">Name</th>
                <th className="py-3 px-6 font-medium">Authority</th>
                <th className="py-3 px-6 font-medium text-right">Current Rate</th>
                <th className="py-3 px-6 font-medium text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {codes.map(code => {
                const authority = authorities.find(a => a.id === code.taxAuthorityId);
                const currentRate = code.rates.length > 0 ? code.rates[code.rates.length - 1].percentage : 0;
                return (
                  <tr key={code.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-6 font-medium text-gray-900">{code.code}</td>
                    <td className="py-4 px-6 text-gray-700">{code.name}</td>
                    <td className="py-4 px-6 text-gray-500">{authority?.name} ({authority?.country})</td>
                    <td className="py-4 px-6 font-semibold text-gray-900 text-right">{currentRate}%</td>
                    <td className="py-4 px-6 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${code.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {code.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
