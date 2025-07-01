import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { getLogs, clearLogs, exportLogs } from '../utils/logger';
import {
  User,
  Mail,
  Calendar,
  Shield,
  Activity,
  Download,
  Trash2,
  Settings,
  Bell,
  Lock,
  Eye
} from 'lucide-react';
import { format } from 'date-fns';

const Profile = () => {
  const { user, updateProfile } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [showLogs, setShowLogs] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!user) return null;

  const [newName, setNewName] = useState(user.name);

  const logs = getLogs(50);

  const filteredLogs = logs.filter(
    log => log.userId === user?.id
  );

  filteredLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const handleExportLogs = () => {
    const logsData = exportLogs();
    const blob = new Blob([logsData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bridge-logs-${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClearLogs = () => {
    if (window.confirm('Are you sure you want to clear all logs? This action cannot be undone.')) {
      clearLogs();
      window.location.reload();
    }
  };

  const handleSaveName = async () => {
    setSaving(true);
    try {
      await updateProfile({ name: newName });
      setEditingName(false);
    } catch (err) {
      alert('Failed to update name');
    }
    setSaving(false);
  };

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'business_person':
        return 'Entrepreneur focused on turning innovative ideas into successful businesses';
      case 'investor':
        return 'Investment professional seeking promising business opportunities';
      case 'banker':
        return 'Financial services professional providing loan and banking solutions';
      case 'business_advisor':
        return 'Experienced consultant helping businesses grow and succeed';
      default:
        return 'Platform user';
    }
  };

  const getActionIcon = (action: string) => {
    if (!action) return '📝';
    if (action.includes('LOGIN') || action.includes('LOGOUT')) return '🔐';
    if (action.includes('BUSINESS_IDEA')) return '💡';
    if (action.includes('INVESTMENT')) return '📈';
    if (action.includes('LOAN')) return '🏦';
    if (action.includes('CONSULTATION')) return '💬';
    return '📝';
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'activity', label: 'Activity Logs', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 text-white">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center text-4xl font-bold">
            {user.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-2">{user.name}</h1>
            <p className="text-blue-100 text-lg capitalize mb-1">
              {user.role.replace('_', ' ')}
            </p>
            <p className="text-blue-200 text-sm">
              {getRoleDescription(user.role)}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
        <div className="flex border-b border-gray-200/50 dark:border-gray-700/50">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {activeTab === 'profile' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <User className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Full Name</p>
                      {editingName ? (
                        <div className="flex gap-2 items-center">
                          <input
                            className="rounded px-2 py-1 text-black"
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            disabled={saving}
                          />
                          <button
                            onClick={handleSaveName}
                            disabled={saving}
                            className="bg-green-600 text-white px-2 py-1 rounded"
                          >
                            {saving ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={() => {
                              setEditingName(false);
                              setNewName(user.name);
                            }}
                            className="bg-gray-400 text-white px-2 py-1 rounded"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900 dark:text-white">{user.name}</span>
                          <button
                            onClick={() => setEditingName(true)}
                            className="ml-2 text-sm bg-blue-500 text-white px-2 py-1 rounded"
                          >
                            Edit
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <Mail className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Email Address</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{user.email}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <Shield className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">User Role</p>
                      <p className="font-semibold text-gray-900 dark:text-white capitalize">
                        {user.role.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Member Since</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {format(new Date(user.createdAt), 'MMMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Role Description
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {getRoleDescription(user.role)}
                </p>
              </div>
            </motion.div>
          )}

          {activeTab === 'activity' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Activity Logs
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Track all your actions and system events
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowLogs(!showLogs)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    {showLogs ? 'Hide' : 'Show'} Logs
                  </button>
                  <button
                    onClick={handleExportLogs}
                    className="flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Export
                  </button>
                  <button
                    onClick={handleClearLogs}
                    className="flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear
                  </button>
                </div>
              </div>
              {showLogs && (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 max-h-96 overflow-y-auto">
                  <div className="space-y-2">
                    {filteredLogs.map((log) => (
                      <div key={log.id} className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
                        <span className="text-xl">{getActionIcon(log.action)}</span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-gray-900 dark:text-white">
                              {log.action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                            </p>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {format(new Date(log.timestamp), 'MMM dd, HH:mm')}
                            </span>
                          </div>
                          {log.data && Object.keys(log.data).length > 0 && (
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              {JSON.stringify(log.data, null, 0).slice(0, 100)}...
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            {log.userId ? `User: ${log.userId}` : ''}
                          </p>
                        </div>
                      </div>
                    ))}
                    {filteredLogs.length === 0 && (
                      <div className="text-center py-8">
                        <Activity className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600 dark:text-gray-300">No activity logs found</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Account Settings
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Email Notifications</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Receive updates about your account</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Lock className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Two-Factor Authentication</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Add an extra layer of security</p>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Enable
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Activity className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Activity Logging</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Track your account activity</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">
                  Danger Zone
                </h4>
                <p className="text-red-600 dark:text-red-400 text-sm mb-4">
                  These actions are irreversible. Please proceed with caution.
                </p>
                <div className="space-y-3">
                  <button className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                    Delete Account
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;