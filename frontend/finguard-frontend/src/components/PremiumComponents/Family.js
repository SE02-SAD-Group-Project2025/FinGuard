import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Ribbon,
  Gamepad2,
  User2,
  Users,
  PlusCircle,
  Pencil,
  Trash2,
} from 'lucide-react';

const Family = () => {
  const [familyMembers, setFamilyMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFamilyMembers();
  }, []);

  const loadFamilyMembers = async () => {
    const token = localStorage.getItem('finguard-token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/family/members', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        // Convert real family data to component format
        const members = (data.members || []).map(member => ({
          id: member.id,
          name: member.display_role || member.role,
          budget: parseFloat(member.monthly_budget) || 0,
          username: member.username
        }));
        setFamilyMembers(members);
      } else {
        // No family members found - empty state
        setFamilyMembers([]);
      }
    } catch (error) {
      console.error('Error loading family members:', error);
      setFamilyMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const [formData, setFormData] = useState({ name: '', budget: '' });
  const [editingIndex, setEditingIndex] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getIconForName = (name) => {
    const lower = name.toLowerCase();
    if (lower.includes('wife')) return <Sparkles className="w-5 h-5 mr-2 text-pink-500" />;
    if (lower.includes('daughter')) return <Ribbon className="w-5 h-5 mr-2 text-pink-500" />;
    if (lower.includes('son')) return <Gamepad2 className="w-5 h-5 mr-2 text-green-500" />;
    if (lower.includes('mother')) return <Sparkles className="w-5 h-5 mr-2 text-purple-500" />;
    if (lower.includes('father')) return <User2 className="w-5 h-5 mr-2 text-blue-500" />;
    if (lower.includes('grand')) return <Users className="w-5 h-5 mr-2 text-yellow-500" />;
    return <User2 className="w-5 h-5 mr-2 text-gray-500" />;
  };

  const openModal = (member = null, index = null) => {
    if (member) {
      setFormData({ name: member.name, budget: member.budget });
      setEditingIndex(index);
    } else {
      setFormData({ name: '', budget: '' });
      setEditingIndex(null);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('finguard-token');
    if (!token) return;

    try {
      if (editingIndex !== null) {
        // Update existing member
        const member = familyMembers[editingIndex];
        const response = await fetch(`http://localhost:5000/api/family/member/${member.id}/budget`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ monthlyBudget: parseInt(formData.budget) })
        });

        if (response.ok) {
          loadFamilyMembers(); // Reload to get updated data
        } else {
          console.error('Failed to update member budget');
        }
      } else {
        // Note: Adding new members should go through the family invitation system
        // This is just a fallback for local state management
        console.log('To add new family members, use the Family Management invitation system');
      }

      setIsModalOpen(false);
      setFormData({ name: '', budget: '' });
      setEditingIndex(null);
    } catch (error) {
      console.error('Error updating family member:', error);
    }
  };

  const handleRemove = async (index) => {
    const confirm = window.confirm('Are you sure you want to remove this family member?');
    if (!confirm) return;

    const member = familyMembers[index];
    const token = localStorage.getItem('finguard-token');
    if (!token) return;

    try {
      const response = await fetch(`http://localhost:5000/api/family/member/${member.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        loadFamilyMembers(); // Reload to get updated data
      } else {
        console.error('Failed to remove family member');
      }
    } catch (error) {
      console.error('Error removing family member:', error);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-md mt-10">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Family Account Management</h3>
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="border p-3 rounded-lg">
                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-md mt-10">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Family Account Management</h3>

      {familyMembers.length === 0 ? (
        <div className="text-center py-8">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">No Family Members</h4>
          <p className="text-gray-600 mb-4">
            You haven't set up family management yet. Use the Family Management page to invite family members.
          </p>
          <button
            onClick={() => window.location.href = '/family-dashboard'}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Go to Family Management
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {familyMembers.map((member, index) => (
            <div key={index} className="group border p-3 rounded-lg flex flex-col items-center relative">
              <div className="flex items-center mb-2">
                {getIconForName(member.name)}
                <span className="font-medium">{member.name}</span>
              </div>
              <p className="text-sm text-gray-500 text-center">
                Budget: Rs.{member.budget.toLocaleString()}/month
              </p>
              {member.username && (
                <p className="text-xs text-gray-400 text-center">
                  {member.username}
                </p>
              )}

              {/* Show on hover only */}
              <div className="absolute top-2 right-2 hidden group-hover:flex gap-2">
                <button
                  onClick={() => openModal(member, index)}
                  className="text-blue-500 hover:text-blue-700"
                  title="Edit Budget"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => handleRemove(index)}
                  className="text-red-500 hover:text-red-700"
                  title="Remove Member"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              className="px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed"
              disabled
              title="Use Family Management to add members"
            >
              <PlusCircle className="inline-block mr-2" size={16} />
              Add Member (Use Family Management)
            </button>
          </div>
        </>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-md w-96">
            <h4 className="text-lg font-semibold mb-4">
              {editingIndex !== null ? 'Edit Budget' : 'Add Account'}
            </h4>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Name (e.g. Wife, Son)"
                className="w-full border p-2 rounded"
                value={formData.name}
                required
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <input
                type="number"
                placeholder="Budget"
                className="w-full border p-2 rounded"
                value={formData.budget}
                required
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
              />
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  className="px-4 py-2 border rounded-lg"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Family;
