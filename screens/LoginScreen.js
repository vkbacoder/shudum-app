import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { saveData, loadData } from '../utils/StorageUtils';

export default function LoginScreen({ navigation }) {
  const { theme } = useTheme();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  const handleLogin = async () => {
    if (username && password) {
      const storedPassword = await loadData('user_password');
      
      if (storedPassword) {
        if (password === storedPassword) {
          navigation.replace('Home', { username: username });
        } else {
          Alert.alert('Error', 'Incorrect password');
        }
      } else {
        // First time login or no password set - save this as the password
        await saveData('user_password', password);
        navigation.replace('Home', { username: username });
      }
    } else {
      Alert.alert('Error', 'Please enter both username and password');
    }
  };

  const handleRegister = async () => {
    if (username && email && password) {
      // Save user profile and password
      await saveData('user_profile', { name: username, email: email });
      await saveData('user_password', password);
      
      Alert.alert('Success', 'Registration successful!', [
        { text: 'OK', onPress: () => navigation.replace('Home', { username: username }) }
      ]);
    } else {
      Alert.alert('Error', 'Please fill in all fields');
    }
  };

  const handleForgotPassword = async () => {
    if (username && email && password) {
      const profileData = await loadData('user_profile');
      
      if (profileData && profileData.name === username && profileData.email === email) {
        await saveData('user_password', password);
        Alert.alert('Success', 'Password reset successful! Please login with your new password.', [
          { text: 'OK', onPress: () => {
            setIsForgotPassword(false);
            setPassword('');
          }}
        ]);
      } else {
        Alert.alert('Error', 'Username or Email does not match our records.');
      }
    } else {
      Alert.alert('Error', 'Please fill in all fields (Username, Email, New Password)');
    }
  };

  const getTitle = () => {
    if (isRegistering) return 'Create Account';
    if (isForgotPassword) return 'Reset Password';
    return 'Welcome Back!';
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>{getTitle()}</Text>
      
      <TextInput
        style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
        placeholder="Username"
        placeholderTextColor={theme.subText}
        value={username}
        onChangeText={setUsername}
      />
      
      {(isRegistering || isForgotPassword) && (
        <TextInput
          style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
          placeholder="Email"
          placeholderTextColor={theme.subText}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      )}

      <View style={[styles.passwordContainer, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}>
        <TextInput
          style={[styles.passwordInput, { color: theme.text }]}
          placeholder={isForgotPassword ? "New Password" : "Password"}
          placeholderTextColor={theme.subText}
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!isPasswordVisible}
        />
        <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
          <Text style={[styles.toggleText, { color: theme.primary }]}>{isPasswordVisible ? 'Hide' : 'Show'}</Text>
        </TouchableOpacity>
      </View>

      {isRegistering ? (
        <Button title="Register" onPress={handleRegister} color={theme.primary} />
      ) : isForgotPassword ? (
        <Button title="Reset Password" onPress={handleForgotPassword} color={theme.primary} />
      ) : (
        <Button title="Login" onPress={handleLogin} color={theme.primary} />
      )}

      {!isRegistering && !isForgotPassword && (
        <TouchableOpacity onPress={() => setIsForgotPassword(true)} style={styles.forgotButton}>
          <Text style={[styles.forgotText, { color: theme.subText }]}>Forgot Password?</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity 
        onPress={() => {
          if (isForgotPassword) {
            setIsForgotPassword(false);
          } else {
            setIsRegistering(!isRegistering);
          }
        }} 
        style={styles.registerButton}
      >
        <Text style={[styles.registerText, { color: theme.primary }]}>
          {isForgotPassword ? 'Back to Login' : (isRegistering ? 'Already have an account? Login' : 'New User? Register Here')}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 15,
    borderWidth: 1,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    height: 50,
    marginBottom: 15,
    paddingHorizontal: 10,
    borderWidth: 1,
  },
  passwordInput: {
    flex: 1,
    height: '100%',
  },
  toggleText: {
    fontWeight: 'bold',
    marginLeft: 10,
  },
  registerButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  registerText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  forgotButton: {
    alignItems: 'flex-end',
    marginTop: 10,
    marginRight: 10,
  },
  forgotText: {
    fontWeight: 'bold',
  },
});
