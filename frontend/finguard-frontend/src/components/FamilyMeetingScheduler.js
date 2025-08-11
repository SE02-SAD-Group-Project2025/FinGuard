import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Video, MapPin, Bell, Plus, Edit3, Trash2, X, CheckCircle, AlertCircle, User } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const FamilyMeetingScheduler = () => {
  const { isDarkMode } = useTheme();
  const [meetings, setMeetings] = useState([]);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');
  
  const [newMeeting, setNewMeeting] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    duration: 60,
    type: 'budget_review',
    meetingType: 'in_person',
    location: '',
    agenda: '',
    attendees: [],
    reminderTime: 1440, // 24 hours in minutes
    isRecurring: false,
    recurringFrequency: 'monthly'
  });

  useEffect(() => {
    loadMeetingData();
  }, []);

  const loadMeetingData = async () => {
    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockFamilyMembers = [
        {
          id: 1,
          name: 'You (Parent)',
          email: 'parent@family.com',
          role: 'parent',
          avatar: null
        },
        {
          id: 2,
          name: 'Sarah (Spouse)',
          email: 'sarah@family.com',
          role: 'parent',
          avatar: null
        },
        {
          id: 3,
          name: 'Alice (Daughter)',
          email: 'alice@family.com',
          role: 'child',
          avatar: null
        },
        {
          id: 4,
          name: 'Bob (Son)',
          email: 'bob@family.com',
          role: 'child',
          avatar: null
        }
      ];

      const mockMeetings = [
        {
          id: 1,
          title: 'Monthly Budget Review',
          description: 'Review August spending and plan for September',
          date: new Date(2025, 7, 15), // August 15, 2025
          time: '19:00',
          duration: 60,
          type: 'budget_review',
          meetingType: 'in_person',
          location: 'Living Room',
          agenda: 'Review expenses, discuss upcoming purchases, set September goals',
          attendees: [1, 2, 3, 4],
          reminderTime: 1440,
          isRecurring: true,
          recurringFrequency: 'monthly',
          status: 'upcoming',
          createdBy: 1,
          responses: {
            1: 'accepted',
            2: 'accepted',
            3: 'pending',
            4: 'pending'
          }
        },
        {
          id: 2,
          title: 'Summer Vacation Planning',
          description: 'Discuss and plan budget for summer vacation',
          date: new Date(2025, 7, 20), // August 20, 2025
          time: '15:00',
          duration: 90,
          type: 'planning',
          meetingType: 'video',
          location: 'Zoom Meeting',
          agenda: 'Destination options, budget allocation, savings plan',
          attendees: [1, 2],
          reminderTime: 720, // 12 hours
          isRecurring: false,
          recurringFrequency: '',
          status: 'upcoming',
          createdBy: 1,
          responses: {
            1: 'accepted',
            2: 'accepted'
          }
        },
        {
          id: 3,
          title: 'Kids Allowance Discussion',
          description: 'Review and adjust children\'s allowances',
          date: new Date(2025, 7, 3), // August 3, 2025
          time: '18:30',
          duration: 45,
          type: 'allowance',
          meetingType: 'in_person',
          location: 'Kitchen',
          agenda: 'Performance review, allowance adjustments, new responsibilities',
          attendees: [1, 2, 3, 4],
          reminderTime: 1440,
          isRecurring: false,
          recurringFrequency: '',
          status: 'completed',
          createdBy: 1,
          responses: {
            1: 'accepted',
            2: 'accepted',
            3: 'accepted',
            4: 'accepted'
          },
          notes: 'Decided to increase Alice\'s allowance by Rs. 500. Bob needs to improve chore completion.'
        },
        {
          id: 4,
          title: 'College Fund Planning',
          description: 'Discuss education savings strategy',
          date: new Date(2025, 8, 1), // September 1, 2025
          time: '20:00',
          duration: 75,
          type: 'savings',
          meetingType: 'in_person',
          location: 'Study Room',
          agenda: 'Review current savings, investment options, timeline planning',
          attendees: [1, 2],
          reminderTime: 2880, // 48 hours
          isRecurring: true,
          recurringFrequency: 'quarterly',
          status: 'upcoming',
          createdBy: 2,
          responses: {
            1: 'pending',
            2: 'accepted'
          }
        }
      ];
      
      setFamilyMembers(mockFamilyMembers);
      setMeetings(mockMeetings);
    } catch (error) {
      console.error('Error loading meeting data:', error);
    } finally {
      setLoading(false);
    }
  };

  const meetingTypes = [
    { value: 'budget_review', label: 'Budget Review', icon: Calendar },
    { value: 'planning', label: 'Financial Planning', icon: MapPin },
    { value: 'allowance', label: 'Allowance Discussion', icon: Users },
    { value: 'savings', label: 'Savings Goals', icon: CheckCircle },
    { value: 'emergency', label: 'Emergency Meeting', icon: AlertCircle },
    { value: 'other', label: 'Other', icon: User }
  ];

  const reminderOptions = [
    { value: 15, label: '15 minutes before' },
    { value: 30, label: '30 minutes before' },
    { value: 60, label: '1 hour before' },
    { value: 120, label: '2 hours before' },
    { value: 720, label: '12 hours before' },
    { value: 1440, label: '1 day before' },
    { value: 2880, label: '2 days before' }
  ];

  const getMeetingIcon = (type) => {
    const meetingType = meetingTypes.find(mt => mt.value === type);
    return meetingType ? meetingType.icon : Calendar;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'upcoming': return 'text-blue-600 dark:text-blue-400';
      case 'completed': return 'text-green-600 dark:text-green-400';
      case 'cancelled': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusBg = (status) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      case 'completed': return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'cancelled': return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      default: return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
    }
  };

  const formatDateTime = (date, time) => {
    const dateObj = new Date(date);
    const formattedDate = dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const [hours, minutes] = time.split(':');
    const timeObj = new Date();
    timeObj.setHours(parseInt(hours), parseInt(minutes));
    const formattedTime = timeObj.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    
    return { date: formattedDate, time: formattedTime };
  };

  const getAttendeeNames = (attendeeIds) => {
    return attendeeIds.map(id => 
      familyMembers.find(member => member.id === id)?.name || 'Unknown'
    ).join(', ');
  };

  const getResponseStatus = (meeting) => {
    const responses = Object.values(meeting.responses);
    const accepted = responses.filter(r => r === 'accepted').length;
    const pending = responses.filter(r => r === 'pending').length;
    const declined = responses.filter(r => r === 'declined').length;
    
    return { accepted, pending, declined, total: responses.length };
  };

  const handleAddMeeting = () => {
    const meetingData = {
      ...newMeeting,
      id: Date.now(),
      date: new Date(newMeeting.date),
      attendees: newMeeting.attendees.map(id => parseInt(id)),
      status: 'upcoming',
      createdBy: 1, // Current user
      responses: newMeeting.attendees.reduce((acc, id) => {
        acc[parseInt(id)] = parseInt(id) === 1 ? 'accepted' : 'pending';
        return acc;
      }, {})
    };
    
    setMeetings(prev => [...prev, meetingData]);
    resetForm();
  };

  const handleEditMeeting = (meeting) => {
    setEditingMeeting(meeting);
    setNewMeeting({
      title: meeting.title,
      description: meeting.description,
      date: meeting.date.toISOString().split('T')[0],
      time: meeting.time,
      duration: meeting.duration,
      type: meeting.type,
      meetingType: meeting.meetingType,
      location: meeting.location,
      agenda: meeting.agenda,
      attendees: meeting.attendees.map(id => id.toString()),
      reminderTime: meeting.reminderTime,
      isRecurring: meeting.isRecurring,
      recurringFrequency: meeting.recurringFrequency
    });
    setShowAddModal(true);
  };

  const handleUpdateMeeting = () => {
    const updatedMeeting = {
      ...editingMeeting,
      ...newMeeting,
      date: new Date(newMeeting.date),
      attendees: newMeeting.attendees.map(id => parseInt(id))
    };
    
    setMeetings(prev => prev.map(meeting => 
      meeting.id === editingMeeting.id ? updatedMeeting : meeting
    ));
    
    resetForm();
  };

  const handleDeleteMeeting = (meetingId) => {
    setMeetings(prev => prev.filter(meeting => meeting.id !== meetingId));
  };

  const handleAttendeeToggle = (memberId) => {
    const memberIdStr = memberId.toString();
    setNewMeeting(prev => ({
      ...prev,
      attendees: prev.attendees.includes(memberIdStr)
        ? prev.attendees.filter(id => id !== memberIdStr)
        : [...prev.attendees, memberIdStr]
    }));
  };

  const resetForm = () => {
    setNewMeeting({
      title: '',
      description: '',
      date: '',
      time: '',
      duration: 60,
      type: 'budget_review',
      meetingType: 'in_person',
      location: '',
      agenda: '',
      attendees: [],
      reminderTime: 1440,
      isRecurring: false,
      recurringFrequency: 'monthly'
    });
    setEditingMeeting(null);
    setShowAddModal(false);
  };

  const filteredMeetings = meetings.filter(meeting => {
    if (activeTab === 'all') return true;
    return meeting.status === activeTab;
  });

  if (loading) {
    return (
      <div className={`p-6 rounded-2xl shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-6">
            <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/3"></div>
            <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-32"></div>
          </div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-300 dark:bg-gray-600 rounded"></div>
            <div className="h-32 bg-gray-300 dark:bg-gray-600 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 rounded-2xl shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Calendar className={`w-6 h-6 mr-3 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
          <div>
            <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Family Financial Meetings
            </h2>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Schedule and manage family financial discussions
            </p>
          </div>
        </div>
        
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Schedule Meeting
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Meetings</p>
              <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {meetings.length}
              </p>
            </div>
            <Calendar className={`w-8 h-8 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
          </div>
        </div>
        
        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Upcoming</p>
              <p className="text-2xl font-bold text-blue-600">
                {meetings.filter(m => m.status === 'upcoming').length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        
        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Completed</p>
              <p className="text-2xl font-bold text-green-600">
                {meetings.filter(m => m.status === 'completed').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        
        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Family Members</p>
              <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {familyMembers.length}
              </p>
            </div>
            <Users className={`w-8 h-8 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2 mb-6 overflow-x-auto">
        {[
          { id: 'all', label: 'All Meetings', count: meetings.length },
          { id: 'upcoming', label: 'Upcoming', count: meetings.filter(m => m.status === 'upcoming').length },
          { id: 'completed', label: 'Completed', count: meetings.filter(m => m.status === 'completed').length }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : isDarkMode
                  ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            {tab.label}
            <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
              activeTab === tab.id
                ? 'bg-white/20 text-white'
                : isDarkMode
                  ? 'bg-gray-600 text-gray-300'
                  : 'bg-gray-200 text-gray-700'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Meetings List */}
      <div className="space-y-4">
        {filteredMeetings.map((meeting) => {
          const MeetingIcon = getMeetingIcon(meeting.type);
          const { date, time } = formatDateTime(meeting.date, meeting.time);
          const responseStatus = getResponseStatus(meeting);
          
          return (
            <div key={meeting.id} className={`p-5 rounded-lg border ${getStatusBg(meeting.status)}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start flex-1">
                  <div className={`p-2 rounded-lg mr-4 ${
                    meeting.status === 'upcoming' ? 'bg-blue-100 dark:bg-blue-900/40' :
                    meeting.status === 'completed' ? 'bg-green-100 dark:bg-green-900/40' :
                    'bg-gray-100 dark:bg-gray-600'
                  }`}>
                    <MeetingIcon className={`w-5 h-5 ${getStatusColor(meeting.status)}`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className={`font-semibold truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {meeting.title}
                      </h3>
                      <div className="flex items-center space-x-2">
                        {meeting.isRecurring && (
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            isDarkMode ? 'bg-purple-900/40 text-purple-300' : 'bg-purple-100 text-purple-800'
                          }`}>
                            {meeting.recurringFrequency}
                          </span>
                        )}
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          meeting.status === 'upcoming' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' :
                          meeting.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-300'
                        }`}>
                          {meeting.status}
                        </span>
                      </div>
                    </div>
                    
                    <p className={`text-sm mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {meeting.description}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs mb-3">
                      <div className="flex items-center space-x-4">
                        <span className={`flex items-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          <Calendar className="w-3 h-3 mr-1" />
                          {date}
                        </span>
                        <span className={`flex items-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          <Clock className="w-3 h-3 mr-1" />
                          {time} ({meeting.duration} min)
                        </span>
                        <span className={`flex items-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {meeting.meetingType === 'video' ? <Video className="w-3 h-3 mr-1" /> : <MapPin className="w-3 h-3 mr-1" />}
                          {meeting.location}
                        </span>
                      </div>
                    </div>

                    {/* Attendees and Responses */}
                    <div className="mb-3">
                      <p className={`text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Attendees ({meeting.attendees.length}):
                      </p>
                      <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {getAttendeeNames(meeting.attendees)}
                      </p>
                      
                      <div className="flex items-center space-x-4 mt-2 text-xs">
                        <span className="flex items-center text-green-600">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          {responseStatus.accepted} accepted
                        </span>
                        <span className="flex items-center text-yellow-600">
                          <Clock className="w-3 h-3 mr-1" />
                          {responseStatus.pending} pending
                        </span>
                        {responseStatus.declined > 0 && (
                          <span className="flex items-center text-red-600">
                            <X className="w-3 h-3 mr-1" />
                            {responseStatus.declined} declined
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Agenda */}
                    {meeting.agenda && (
                      <div className="mb-3">
                        <p className={`text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Agenda:
                        </p>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {meeting.agenda}
                        </p>
                      </div>
                    )}

                    {/* Meeting Notes (for completed meetings) */}
                    {meeting.status === 'completed' && meeting.notes && (
                      <div className="mb-3">
                        <p className={`text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Meeting Notes:
                        </p>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {meeting.notes}
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {meeting.status === 'upcoming' && (
                          <button className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                            Join Meeting
                          </button>
                        )}
                        <button
                          onClick={() => handleEditMeeting(meeting)}
                          className={`p-1 rounded transition-colors ${
                            isDarkMode 
                              ? 'text-gray-400 hover:text-white hover:bg-gray-600' 
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                          }`}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteMeeting(meeting.id)}
                          className="p-1 rounded text-red-600 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Bell className={`w-3 h-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                        <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {reminderOptions.find(r => r.value === meeting.reminderTime)?.label}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredMeetings.length === 0 && (
        <div className="text-center py-12">
          <Calendar className={`w-16 h-16 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
          <h3 className={`text-lg font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            No Meetings Found
          </h3>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {activeTab === 'all' 
              ? 'Schedule your first family financial meeting.'
              : `No ${activeTab} meetings found.`
            }
          </p>
        </div>
      )}

      {/* Add/Edit Meeting Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`p-6 rounded-2xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {editingMeeting ? 'Edit Meeting' : 'Schedule New Meeting'}
              </h3>
              <button
                onClick={resetForm}
                className={`text-gray-400 hover:text-gray-600 ${isDarkMode ? 'hover:text-gray-300' : ''}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Meeting Title
                </label>
                <input
                  type="text"
                  value={newMeeting.title}
                  onChange={(e) => setNewMeeting({...newMeeting, title: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="e.g., Monthly Budget Review"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Description
                </label>
                <textarea
                  value={newMeeting.description}
                  onChange={(e) => setNewMeeting({...newMeeting, description: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  rows="2"
                  placeholder="Brief description of the meeting"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Date
                  </label>
                  <input
                    type="date"
                    value={newMeeting.date}
                    onChange={(e) => setNewMeeting({...newMeeting, date: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Time
                  </label>
                  <input
                    type="time"
                    value={newMeeting.time}
                    onChange={(e) => setNewMeeting({...newMeeting, time: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={newMeeting.duration}
                    onChange={(e) => setNewMeeting({...newMeeting, duration: parseInt(e.target.value)})}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    min="15"
                    step="15"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Meeting Type
                  </label>
                  <select
                    value={newMeeting.type}
                    onChange={(e) => setNewMeeting({...newMeeting, type: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    {meetingTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Format
                  </label>
                  <select
                    value={newMeeting.meetingType}
                    onChange={(e) => setNewMeeting({...newMeeting, meetingType: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="in_person">In Person</option>
                    <option value="video">Video Call</option>
                    <option value="phone">Phone Call</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Reminder
                  </label>
                  <select
                    value={newMeeting.reminderTime}
                    onChange={(e) => setNewMeeting({...newMeeting, reminderTime: parseInt(e.target.value)})}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    {reminderOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Location
                </label>
                <input
                  type="text"
                  value={newMeeting.location}
                  onChange={(e) => setNewMeeting({...newMeeting, location: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder={newMeeting.meetingType === 'video' ? 'Zoom/Teams link' : 'Meeting location'}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Agenda
                </label>
                <textarea
                  value={newMeeting.agenda}
                  onChange={(e) => setNewMeeting({...newMeeting, agenda: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  rows="3"
                  placeholder="Meeting agenda and topics to discuss"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Attendees
                </label>
                <div className="space-y-2">
                  {familyMembers.map(member => (
                    <label key={member.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newMeeting.attendees.includes(member.id.toString())}
                        onChange={() => handleAttendeeToggle(member.id)}
                        className="mr-2"
                      />
                      <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {member.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isRecurring"
                    checked={newMeeting.isRecurring}
                    onChange={(e) => setNewMeeting({...newMeeting, isRecurring: e.target.checked})}
                    className="mr-2"
                  />
                  <label htmlFor="isRecurring" className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Recurring meeting
                  </label>
                </div>
                
                {newMeeting.isRecurring && (
                  <select
                    value={newMeeting.recurringFrequency}
                    onChange={(e) => setNewMeeting({...newMeeting, recurringFrequency: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                )}
              </div>
            </div>
            
            <div className="flex space-x-3 pt-6">
              <button
                onClick={resetForm}
                className={`flex-1 px-4 py-2 border rounded-lg transition-colors ${
                  isDarkMode 
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={editingMeeting ? handleUpdateMeeting : handleAddMeeting}
                disabled={!newMeeting.title || !newMeeting.date || !newMeeting.time || newMeeting.attendees.length === 0}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {editingMeeting ? 'Update Meeting' : 'Schedule Meeting'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FamilyMeetingScheduler;