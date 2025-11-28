import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Button, Image, TouchableOpacity, ScrollView, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { saveData, loadData, removeData } from '../utils/StorageUtils';
import { useTheme } from '../context/ThemeContext';

export default function ProfileScreen({ navigation }) {
  const { theme } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [image, setImage] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const profileData = await loadData('user_profile');
    if (profileData) {
      setName(profileData.name || '');
      setEmail(profileData.email || '');
      setBio(profileData.bio || '');
      setImage(profileData.image || null);
    }
  };

  const saveProfile = async () => {
    const profileData = { name, email, bio, image };
    await saveData('user_profile', profileData);
    setIsEditing(false);
    Alert.alert('Success', 'Profile updated successfully!');
  };

  const pickImage = async () => {
    if (!isEditing) return;
    
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleLogout = async () => {
    // Clear user session
    await removeData('user_password');
    navigation.replace('Login');
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>My Profile</Text>
      
      <TouchableOpacity onPress={pickImage} style={styles.profileContainer}>
        {image ? (
          <Image source={{ uri: image }} style={[styles.image, { borderColor: theme.card }]} />
        ) : (
          <View style={[styles.placeholder, { backgroundColor: theme.border, borderColor: theme.card }]}>
            <Text style={styles.placeholderText}>Add Photo</Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={[styles.infoContainer, { backgroundColor: theme.card }]}>
        <Text style={styles.label}>Name</Text>
        {isEditing ? (
          <TextInput 
            style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]} 
            value={name} 
            onChangeText={setName} 
          />
        ) : (
          <Text style={[styles.value, { color: theme.text, borderBottomColor: theme.border }]}>{name || 'Not set'}</Text>
        )}

        <Text style={styles.label}>Email</Text>
        {isEditing ? (
          <TextInput 
            style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]} 
            value={email} 
            onChangeText={setEmail} 
            keyboardType="email-address" 
          />
        ) : (
          <Text style={[styles.value, { color: theme.text, borderBottomColor: theme.border }]}>{email || 'Not set'}</Text>
        )}

        <Text style={styles.label}>Bio</Text>
        {isEditing ? (
          <TextInput 
            style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]} 
            value={bio} 
            onChangeText={setBio} 
            multiline 
          />
        ) : (
          <Text style={[styles.value, { color: theme.text, borderBottomColor: theme.border }]}>{bio || 'Not set'}</Text>
        )}
      </View>

      <View style={styles.buttonContainer}>
        {isEditing ? (
          <Button title="Save Profile" onPress={saveProfile} color={theme.primary} />
        ) : (
          <Button title="Edit Profile" onPress={() => setIsEditing(true)} color={theme.primary} />
        )}
      </View>

      <View style={styles.buttonContainer}>
        <Button title="Settings" onPress={() => navigation.navigate('Settings')} color={theme.primary} />
      </View>
      
      <View style={styles.logoutButton}>
        <Button title="Logout" onPress={handleLogout} color={theme.primary}/>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  profileContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  image: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 10,
    borderWidth: 3,
  },
  placeholder: {
    width: 150,
    height: 150,
    borderRadius: 75,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 3,
  },
  placeholderText: {
    color: '#888'
  },
  infoContainer: {
    width: '100%',
    marginBottom: 30,
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  label: {
    color: '#888',
    fontSize: 14,
    marginBottom: 5,
  },
  value: {
    fontSize: 18,
    marginBottom: 15,
    borderBottomWidth: 1,
    paddingBottom: 5,
  },
  input: {
    padding: 10,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 15,
  },
  logoutButton: {
    width: '100%',
    marginBottom: 100, // Space for tab bar
  }
});
