import React, { useEffect, useState } from 'react';
import { Shield, Trash2, Loader2, RefreshCw, Laptop, Smartphone, Globe, Calendar, MapPin, AlertCircle, HelpCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { ConfirmModal } from './ConfirmModal';
import { apiFetch } from '../lib/api';
interface Device {
  tokenId: string;
  description: string;
  timeUpdated: number | null;
  platformType: number;
  loggedIn: boolean;
  osPlatform: number;
  isCurrentDevice: boolean;
  lastSeen: {
    time: number | null;
    country: string;
    state: string;
    city: string;
  } | null;
}
export const DevicesView: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const fetchDevices = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/steam/active-devices');
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch active devices.');
      }
      setDevices(data.devices || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load authorized devices.');
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchDevices();
  }, []);
  const handleRevokeClick = (device: Device) => {
    setSelectedDevice(device);
  };
  const handleConfirmRevoke = async () => {
    if (!selectedDevice) return;
    setIsRevoking(true);
    try {
      const res = await apiFetch('/api/steam/revoke-device', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenId: selectedDevice.tokenId }),
      });
      if (!res.ok) {
        throw new Error(await res.text() || 'Failed to revoke device.');
      }
      setDevices(prev => prev.filter(d => d.tokenId !== selectedDevice.tokenId));
      setSelectedDevice(null);
    } catch (err: any) {
      alert(err.message || 'Failed to revoke device.');
    } finally {
      setIsRevoking(false);
    }
  };
  const getPlatformIcon = (platformType: number, osPlatform: number) => {
    if (platformType === 3) {
      return <Smartphone className="w-4 h-4 text-zinc-400" />;
    }
    if (platformType === 2) {
      return <Globe className="w-4 h-4 text-zinc-400" />;
    }
    return <Laptop className="w-4 h-4 text-zinc-400" />;
  };
  const getPlatformLabel = (platformType: number, osPlatform: number) => {
    let platform = 'Unknown';
    if (platformType === 1) platform = 'Steam Client';
    else if (platformType === 2) platform = 'Web Browser';
    else if (platformType === 3) platform = 'Mobile App';
    let os = '';
    if (osPlatform === 1) os = 'Windows';
    else if (osPlatform === 2) os = 'macOS';
    else if (osPlatform === 3) os = 'Linux';
    else if (osPlatform === 4) os = 'iOS';
    else if (osPlatform === 5) os = 'Android';
    return os ? `${platform} (${os})` : platform;
  };
  return (
    <div className="space-y-6" id="authorized-devices-container">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="w-5 h-5 text-zinc-400" />
            <span>Authorized Devices</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1 max-w-xl">
            These devices can currently access your Steam account. Remove any session you don't recognize to secure your account.
          </p>
        </div>
        <button
          onClick={fetchDevices}
          disabled={isLoading}
          className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 transition-colors disabled:opacity-50 cursor-pointer max-sm:w-full self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh List</span>
        </button>
      </div>
      {error && (
        <div className="p-4 bg-red-950/20 border border-red-900/50 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-red-200">Error fetching devices</p>
            <p className="text-xs text-red-300/80 leading-relaxed">{error}</p>
          </div>
        </div>
      )}
      {isLoading && devices.length === 0 ? (
        <div className="h-64 rounded-xl border border-zinc-800 bg-zinc-950/40 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-zinc-500 animate-spin" />
          <p className="text-sm text-zinc-400">Retrieving active Steam sessions...</p>
        </div>
      ) : devices.length === 0 ? (
        <div className="h-64 rounded-xl border border-zinc-800 bg-zinc-950/40 flex flex-col items-center justify-center gap-2 text-center p-6">
          <Shield className="w-10 h-10 text-zinc-600 mb-2" />
          <p className="text-sm font-bold text-zinc-300">No Authorized Devices Found</p>
          <p className="text-xs text-zinc-500 max-w-sm">
            We couldn't retrieve any authorized refresh tokens. Make sure you are logged in and your connection is active.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {devices.map((device) => (
            <div
              key={device.tokenId}
              className={`p-5 rounded-xl border transition-all ${
                device.isCurrentDevice
                  ? 'bg-zinc-900/40 border-zinc-700/80 shadow-[0_0_15px_rgba(255,255,255,0.03)]'
                  : 'bg-zinc-950/30 border-zinc-800/80 hover:bg-zinc-900/20'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className={`p-2.5 rounded-lg shrink-0 ${
                    device.isCurrentDevice
                      ? 'bg-white text-black'
                      : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                  }`}>
                    {getPlatformIcon(device.platformType, device.osPlatform)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-bold text-white tracking-tight">
                        {device.description || 'Unnamed Session'}
                      </h4>
                      {device.isCurrentDevice && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-black tracking-wide uppercase">
                          Current Device
                        </span>
                      )}
                      {device.loggedIn && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-800 border border-zinc-700 text-zinc-300 tracking-wide uppercase">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-y-1 gap-x-3.5 text-xs text-zinc-400">
                      <span className="flex items-center gap-1">
                        <HelpCircle className="w-3.5 h-3.5" />
                        {getPlatformLabel(device.platformType, device.osPlatform)}
                      </span>
                      {device.timeUpdated && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Last Auth: {new Date(device.timeUpdated).toLocaleDateString()}</span>
                        </span>
                      )}
                      {device.lastSeen && (device.lastSeen.city || device.lastSeen.country) && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>
                            {[device.lastSeen.city, device.lastSeen.state, device.lastSeen.country]
                              .filter(Boolean)
                              .join(', ')}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {!device.isCurrentDevice && (
                  <button
                    onClick={() => handleRevokeClick(device)}
                    className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded text-xs font-semibold bg-red-950/20 hover:bg-red-900/30 border border-red-900/40 text-red-400 hover:text-red-300 transition-colors cursor-pointer max-sm:w-full self-start"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Deauthorize</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <ConfirmModal
        isOpen={selectedDevice !== null}
        title="Deauthorize Device"
        message={`Are you sure you want to revoke authorization for "${selectedDevice?.description || 'this device'}"? This will log the device out of Steam immediately.`}
        warningText="You cannot undo this action. The device must enter Steam Guard credentials to sign in again."
        confirmText="Deauthorize"
        cancelText="Cancel"
        isDanger={true}
        isLoading={isRevoking}
        onConfirm={handleConfirmRevoke}
        onCancel={() => setSelectedDevice(null)}
      />
    </div>
  );
};
