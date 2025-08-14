import React, { useState } from 'react';
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
  const [familyMembers, setFamilyMembers] = useState([
    { name: 'Wife', budget: 15000 },
    { name: 'Daughter', budget: 5000 },
    { name: 'Son', budget: 3000 },
  ]);

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

  const handleSubmit = (e) => {
    e.preventDefault();
    const newMember = {
      name: formData.name,
      budget: parseInt(formData.budget),
    };

    if (editingIndex !== null) {
      const updated = [...familyMembers];
      updated[editingIndex] = newMember;
      setFamilyMembers(updated);
    } else {
      setFamilyMembers([...familyMembers, newMember]);
    }

    setIsModalOpen(false);
  };

  const handleRemove = (index) => {
    const confirm = window.confirm('Are you sure you want to remove this account?');
    if (confirm) {
      const updated = familyMembers.filter((_, i) => i !== index);
      setFamilyMembers(updated);
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-md mt-10">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Family Account Management</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {familyMembers.map((member, index) => (
          <div key={index} className="group border p-3 rounded-lg flex flex-col items-center relative">
            <div className="flex items-center mb-2">
              {getIconForName(member.name)}
              <span className="font-medium">{member.name}</span>
            </div>
            <p className="text-sm text-gray-500 text-center">
              Budget: LKR {member.budget.toLocaleString()}/month
            </p>

            {/* Show on hover only */}
            <div className="absolute top-2 right-2 hidden group-hover:flex gap-2">
              <button
                onClick={() => openModal(member, index)}
                className="text-blue-500 hover:text-blue-700"
                title="Edit"
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={() => handleRemove(index)}
                className="text-red-500 hover:text-red-700"
                title="Delete"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          onClick={() => openModal()}
        >
          <PlusCircle className="inline-block mr-2" size={16} />
          Add Account
        </button>
      </div>

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
