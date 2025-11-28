import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, Modal, Alert, Image, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { saveData, loadData } from '../utils/StorageUtils';
import DateStrip from '../components/DateStrip';
import { useTheme } from '../context/ThemeContext';

export default function PlannerScreen({ navigation }) {
  const { theme } = useTheme();
  const [selectedDate, setSelectedDate] = useState('');
  const [tasks, setTasks] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskTime, setNewTaskTime] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('Medium');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  
  // Profile Data
  const [username, setUsername] = useState('Vishnu');
  const [profileImage, setProfileImage] = useState(null);

  // Daily Challenge Data
  const [challengeText, setChallengeText] = useState('Do your plan before 09:00 AM');
  const [challengeCompleted, setChallengeCompleted] = useState(false);
  const [challengeModalVisible, setChallengeModalVisible] = useState(false);
  const [newChallengeText, setNewChallengeText] = useState('');

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
    loadTasks();
    loadChallenge();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const results = [];
      Object.keys(tasks).forEach(date => {
        tasks[date].forEach(task => {
          if (task.title.toLowerCase().includes(searchQuery.toLowerCase())) {
            results.push({ ...task, date });
          }
        });
      });
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, tasks]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [])
  );

  const loadProfile = async () => {
    const data = await loadData('user_profile');
    if (data) {
      if (data.name) setUsername(data.name);
      if (data.image) setProfileImage(data.image);
    }
  };

  const loadTasks = async () => {
    const data = await loadData('planner_tasks');
    if (data) setTasks(data);
  };

  const saveTasks = async (newTasks) => {
    setTasks(newTasks);
    await saveData('planner_tasks', newTasks);
  };

  const loadChallenge = async () => {
    const data = await loadData('daily_challenge');
    if (data) {
      setChallengeText(data.text);
      setChallengeCompleted(data.completed);
    }
  };

  const saveChallenge = async (text, completed) => {
    setChallengeText(text);
    setChallengeCompleted(completed);
    await saveData('daily_challenge', { text, completed });
  };

  const handleUpdateChallenge = () => {
    saveChallenge(newChallengeText, false);
    setChallengeModalVisible(false);
  };

  const toggleChallengeCompletion = () => {
    saveChallenge(challengeText, !challengeCompleted);
  };

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) {
      Alert.alert("Error", "Please enter a task title");
      return;
    }

    if (!newTaskTime.trim()) {
      Alert.alert("Error", "Please enter a time");
      return;
    }

    const newTasks = { ...tasks };
    if (!newTasks[selectedDate]) {
      newTasks[selectedDate] = [];
    }
    newTasks[selectedDate].push({
      title: newTaskTitle,
      priority: newTaskPriority,
      completed: false,
      time: newTaskTime,
    });

    saveTasks(newTasks);
    setModalVisible(false);
    setNewTaskTitle('');
    setNewTaskTime('');
    setNewTaskPriority('Medium');
  };

  const toggleTaskCompletion = (date, index) => {
    const newTasks = { ...tasks };
    newTasks[date][index].completed = !newTasks[date][index].completed;
    saveTasks(newTasks);
  };

  const deleteTask = (date, index) => {
    const newTasks = { ...tasks };
    newTasks[date].splice(index, 1);
    saveTasks(newTasks);
  };

  const renderTaskCard = ({ item, index, date }) => {
    const isYellow = index % 2 === 0;
    const cardColor = isYellow ? '#FFD573' : '#AECBFA'; // Yellow or Light Blue
    const textColor = '#1E1E1E';
    
    // Find the actual index in the original array if searching
    const taskIndex = isSearching 
      ? tasks[date].findIndex(t => t.title === item.title && t.time === item.time) 
      : index;

    return (
      <View style={[styles.taskCard, { backgroundColor: cardColor }]}>
        <View style={styles.cardHeader}>
          <View style={styles.priorityTag}>
            <Text style={styles.priorityText}>{item.priority}</Text>
          </View>
          <TouchableOpacity onPress={() => deleteTask(date, taskIndex)}>
             <Ionicons name="close-circle-outline" size={24} color={textColor} />
          </TouchableOpacity>
        </View>
        
        <Text style={[styles.cardTitle, item.completed && styles.completedText]}>{item.title}</Text>
        
        <View style={styles.cardDetails}>
          <Text style={styles.cardDetailText}>{date}</Text>
          <Text style={styles.cardDetailText}>{item.time}</Text>
        </View>

        <View style={styles.cardFooter}>
           <TouchableOpacity onPress={() => toggleTaskCompletion(date, taskIndex)}>
              <Ionicons name={item.completed ? "checkbox" : "square-outline"} size={24} color={textColor} />
           </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Ionicons name="person" size={30} color="#FFF" />
                </View>
              )}
            </TouchableOpacity>
            <View>
              <Text style={[styles.greeting, { color: theme.text }]}>Hello, {username}</Text>
              <Text style={[styles.dateText, { color: theme.subText }]}>Today {new Date().getDate()} Nov.</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={[styles.searchButton, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => {
              setIsSearching(!isSearching);
              setSearchQuery('');
            }}
          >
            <Ionicons name={isSearching ? "close" : "search"} size={24} color={theme.icon} />
          </TouchableOpacity>
        </View>

        {isSearching ? (
          <View>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
              placeholder="Search tasks..."
              placeholderTextColor={theme.subText}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 15 }]}>Search Results</Text>
            <View style={styles.gridContainer}>
              {searchResults.map((item, index) => (
                 <View key={index} style={styles.gridItemWrapper}>
                    {renderTaskCard({ item, index, date: item.date })}
                 </View>
              ))}
              {searchResults.length === 0 && searchQuery.length > 0 && (
                 <Text style={[styles.emptyText, { color: theme.subText }]}>No matching tasks found.</Text>
              )}
            </View>
          </View>
        ) : (
          <>
            {/* Daily Challenge Card */}
            <TouchableOpacity 
              style={[styles.challengeCard, challengeCompleted && styles.challengeCardCompleted]} 
              onPress={() => {
                setNewChallengeText(challengeText);
                setChallengeModalVisible(true);
              }}
            >
              <View style={styles.challengeContent}>
                <Text style={styles.challengeTitle}>Daily challenge</Text>
                <Text style={[styles.challengeSubtitle, challengeCompleted && styles.completedText]}>
                  {challengeText}
                </Text>

              </View>
              <TouchableOpacity onPress={toggleChallengeCompletion} style={styles.graphicPlaceholder}>
                 <Ionicons name={challengeCompleted ? "checkmark-circle" : "cube"} size={80} color={challengeCompleted ? "#4CAF50" : "#FFD573"} />
              </TouchableOpacity>
            </TouchableOpacity>

            {/* Month Selector */}
            <View style={styles.monthSelector}>
              <TouchableOpacity onPress={() => {
                const newDate = new Date(currentMonth);
                newDate.setMonth(newDate.getMonth() - 1);
                setCurrentMonth(newDate);
              }}>
                <Ionicons name="chevron-back" size={24} color={theme.icon} />
              </TouchableOpacity>
              <Text style={[styles.monthText, { color: theme.text }]}>
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </Text>
              <TouchableOpacity onPress={() => {
                const newDate = new Date(currentMonth);
                newDate.setMonth(newDate.getMonth() + 1);
                setCurrentMonth(newDate);
              }}>
                <Ionicons name="chevron-forward" size={24} color={theme.icon} />
              </TouchableOpacity>
            </View>

            {/* Date Strip */}
            <DateStrip selectedDate={selectedDate} onDateSelect={setSelectedDate} currentMonth={currentMonth} />

            {/* Your Plan */}
            <View style={styles.planHeader}>
               <Text style={[styles.sectionTitle, { color: theme.text }]}>Your plan</Text>
               <TouchableOpacity onPress={() => setModalVisible(true)}>
                 <Text style={[styles.addTaskLink, { color: theme.primary }]}>+ Add Task</Text>
               </TouchableOpacity>
            </View>
            
            <View style={styles.gridContainer}>
              {(tasks[selectedDate] || []).map((item, index) => (
                 <View key={index} style={styles.gridItemWrapper}>
                    {renderTaskCard({ item, index, date: selectedDate })}
                 </View>
              ))}
              {(!tasks[selectedDate] || tasks[selectedDate].length === 0) && (
                 <Text style={[styles.emptyText, { color: theme.subText }]}>No tasks for this day.</Text>
              )}
            </View>
          </>
        )}
        
        {/* Spacer for floating tab bar */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Add Task Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[styles.modalView, { backgroundColor: theme.card }]}>
          <Text style={[styles.modalTitle, { color: theme.text }]}>Add Task</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text }]}
            placeholder="Task Title"
            placeholderTextColor={theme.subText}
            value={newTaskTitle}
            onChangeText={setNewTaskTitle}
          />
          <TextInput
            style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text }]}
            placeholder="Time (e.g. 02:00 PM)"
            placeholderTextColor={theme.subText}
            value={newTaskTime}
            onChangeText={setNewTaskTime}
          />
          <View style={styles.priorityContainer}>
            {['High', 'Medium', 'Low'].map(p => (
              <TouchableOpacity
                key={p}
                style={[styles.priorityButton, { borderColor: theme.primary }, newTaskPriority === p && { backgroundColor: theme.primary }]}
                onPress={() => setNewTaskPriority(p)}
              >
                <Text style={[styles.priorityText, { color: theme.text }]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.modalButtons}>
            <TouchableOpacity style={[styles.button, styles.buttonCancel]} onPress={() => setModalVisible(false)}>
              <Text style={styles.textStyle}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={handleAddTask}>
              <Text style={styles.textStyle}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Edit Challenge Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={challengeModalVisible}
        onRequestClose={() => setChallengeModalVisible(false)}
      >
        <View style={[styles.modalView, { backgroundColor: theme.card }]}>
          <Text style={[styles.modalTitle, { color: theme.text }]}>Edit Daily Challenge</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text }]}
            placeholder="Enter challenge..."
            placeholderTextColor={theme.subText}
            value={newChallengeText}
            onChangeText={setNewChallengeText}
          />
          <View style={styles.modalButtons}>
            <TouchableOpacity style={[styles.button, styles.buttonCancel]} onPress={() => setChallengeModalVisible(false)}>
              <Text style={styles.textStyle}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={handleUpdateChallenge}>
              <Text style={styles.textStyle}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  avatarPlaceholder: {
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  dateText: {
  },
  searchButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  challengeCard: {
    backgroundColor: '#BFA2FA',
    borderRadius: 25,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    height: 180,
  },
  challengeCardCompleted: {
    backgroundColor: '#E0E0E0',
  },
  challengeContent: {
    flex: 1,
  },
  challengeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E1E1E',
    marginBottom: 5,
  },
  challengeSubtitle: {
    color: '#555',
    marginBottom: 15,
  },

  graphicPlaceholder: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  addTaskLink: {
    fontWeight: 'bold',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItemWrapper: {
    width: '48%',
    marginBottom: 15,
  },
  taskCard: {
    borderRadius: 20,
    padding: 20,
    minHeight: 180,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  priorityTag: {
    backgroundColor: 'rgba(255,255,255,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E1E1E',
    marginBottom: 10,
  },
  completedText: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  cardDetails: {
    marginBottom: 15,
  },
  cardDetailText: {
    color: '#555',
    fontSize: 12,
    marginBottom: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emptyText: {
    fontStyle: 'italic',
    width: '100%',
    textAlign: 'center',
    marginTop: 20,
  },
  modalView: {
    margin: 20,
    marginTop: 100,
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  input: {
    width: '100%',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
    borderWidth: 1,
  },
  priorityContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  priorityButton: {
    padding: 10,
    borderWidth: 1,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    borderRadius: 10,
    padding: 10,
    elevation: 2,
    width: '45%',
    alignItems: 'center',
  },
  buttonCancel: {
    backgroundColor: '#FF6347',
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center'
  },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  monthText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});
