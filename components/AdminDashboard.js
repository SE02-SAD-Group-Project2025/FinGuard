import React, { useState } from 'react';
import AdminNavbar from './AdminNavbar';
import { Users, ClipboardList, FolderCog, Pencil, Trash2 } from 'lucide-react';
import AdminSummaryCards from './AdminSummaryCards';
import UserActivityChart from './UserActivityChart';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [newCategory, setNewCategory] = useState('');
  const [categories, setCategories] = useState(['Food', 'Transport', 'Utilities', 'Healthcare']);

  const users = [
    { id: 1, name: 'Sandil', email: 'sandil@example.com', role: 'Admin' },
    { id: 2, name: 'Chathura', email: 'chathura@example.com', role: 'User' },
  ];

  const logs = [
    { id: 1, activity: 'User login', timestamp: '2025-07-03 12:01' },
    { id: 2, activity: 'Budget updated', timestamp: '2025-07-03 12:10' },
  ];

  const handleAddCategory = () => {
    if (newCategory && !categories.includes(newCategory)) {
      setCategories([...categories, newCategory]);
      setNewCategory('');
    }
  };

  return (
    <>
      {/* Full-width Sticky Admin Navbar */}
      <AdminNavbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Heading */}
        

        {/* Summary Cards */}
        <AdminSummaryCards 
          userCount={users.length} 
          logCount={logs.length} 
          adminCount={1} 
          issueCount={6} 
        />

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-6">
          {[
            { id: 'users', label: 'Manage Users', icon: <Users className="w-4 h-4" /> },
            { id: 'logs', label: 'View Logs', icon: <ClipboardList className="w-4 h-4" /> },
            { id: 'categories', label: 'Manage Categories', icon: <FolderCog className="w-4 h-4" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium border ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border-gray-300'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Main Tab Content */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          {/* Manage Users */}
          {activeTab === 'users' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">User List</h2>
              <table className="w-full table-auto text-left border">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-3">Name</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-t">
                      <td className="p-3">{user.name}</td>
                      <td className="p-3">{user.email}</td>
                      <td className="p-3">{user.role}</td>
                      <td className="p-3 space-x-3 flex items-center">
                        <button className="text-blue-600 hover:text-blue-800" title="Edit">
                          <Pencil className="w-5 h-5" />
                        </button>
                        <button className="text-red-600 hover:text-red-800" title="Delete">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* View Logs */}
          {activeTab === 'logs' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">System Logs</h2>
              <ul className="space-y-2">
                {logs.map((log) => (
                  <li key={log.id} className="p-3 border rounded bg-gray-50">
                    <strong>{log.activity}</strong>{' '}
                    <span className="text-sm text-gray-500">({log.timestamp})</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Manage Categories */}
          {activeTab === 'categories' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Manage Categories</h2>
              <div className="flex mb-4 gap-2">
                <input
                  type="text"
                  className="border px-4 py-2 rounded w-full"
                  placeholder="Enter new category"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                />
                <button
                  onClick={handleAddCategory}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  Add
                </button>
              </div>
              <ul className="list-disc pl-6 space-y-1">
                {categories.map((cat, index) => (
                  <li key={index}>{cat}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <UserActivityChart />
      </div>
    </>
  );
};

export default AdminDashboard;
