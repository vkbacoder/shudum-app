import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, Modal, Alert } from 'react-native';
import { saveData, loadData } from '../utils/StorageUtils';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export default function MoneyScreen() {
  const { theme } = useTheme();
  
  // Transaction State
  const [transactions, setTransactions] = useState([]);
  const [balance, setBalance] = useState(0);
  const [income, setIncome] = useState(0);
  const [expense, setExpense] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [newAmount, setNewAmount] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newNote, setNewNote] = useState('');
  const [newType, setNewType] = useState('Expense');
  const [searchQuery, setSearchQuery] = useState('');

  // People Manager State
  const [viewMode, setViewMode] = useState('transactions'); // 'transactions' or 'people'
  const [people, setPeople] = useState([]);
  const [addPersonModalVisible, setAddPersonModalVisible] = useState(false);
  const [personDetailsModalVisible, setPersonDetailsModalVisible] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [newPersonName, setNewPersonName] = useState('');
  const [debtAmount, setDebtAmount] = useState('');

  useEffect(() => {
    loadTransactions();
    loadPeople();
  }, []);

  useEffect(() => {
    calculateBalance();
  }, [transactions]);

  // --- Transaction Logic ---
  const loadTransactions = async () => {
    const data = await loadData('money_transactions');
    if (data) setTransactions(data);
  };

  const saveTransactions = async (newTransactions) => {
    setTransactions(newTransactions);
    await saveData('money_transactions', newTransactions);
  };

  const calculateBalance = () => {
    let inc = 0;
    let exp = 0;
    transactions.forEach(t => {
      if (t.type === 'Income') inc += parseFloat(t.amount);
      else exp += parseFloat(t.amount);
    });
    setIncome(inc);
    setExpense(exp);
    setBalance(inc - exp);
  };

  const handleAddTransaction = () => {
    if (!newAmount || !newCategory) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    const newTransaction = {
      id: Date.now().toString(),
      amount: parseFloat(newAmount),
      category: newCategory,
      note: newNote,
      type: newType,
      date: new Date().toISOString().split('T')[0],
    };

    const newTransactions = [newTransaction, ...transactions];
    saveTransactions(newTransactions);
    setModalVisible(false);
    setNewAmount('');
    setNewCategory('');
    setNewNote('');
  };

  const deleteTransaction = (id) => {
    const newTransactions = transactions.filter(t => t.id !== id);
    saveTransactions(newTransactions);
  };

  // --- People Manager Logic ---
  const loadPeople = async () => {
    const data = await loadData('money_people');
    if (data) setPeople(data);
  };

  const savePeople = async (newPeople) => {
    setPeople(newPeople);
    await saveData('money_people', newPeople);
  };

  const handleAddPerson = () => {
    if (!newPersonName.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }
    const newPerson = {
      id: Date.now().toString(),
      name: newPersonName,
      owe: 0, // I owe them
      owed: 0, // They owe me
    };
    const newPeople = [...people, newPerson];
    savePeople(newPeople);
    setAddPersonModalVisible(false);
    setNewPersonName('');
  };

  const handleUpdateDebt = (type) => {
    if (!debtAmount || isNaN(debtAmount)) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    const amount = parseFloat(debtAmount);
    const updatedPeople = people.map(p => {
      if (p.id === selectedPerson.id) {
        let newP = { ...p };
        if (type === 'borrowed') newP.owe += amount; // I borrowed, so I owe more
        if (type === 'repaid') newP.owe = Math.max(0, newP.owe - amount); // I repaid, so I owe less
        if (type === 'lent') newP.owed += amount; // I lent, so they owe me more
        if (type === 'received') newP.owed = Math.max(0, newP.owed - amount); // I received, so they owe me less
        setSelectedPerson(newP); // Update local selected person to reflect changes immediately
        return newP;
      }
      return p;
    });
    savePeople(updatedPeople);
    setDebtAmount('');
  };

  const deletePerson = (id) => {
      const newPeople = people.filter(p => p.id !== id);
      savePeople(newPeople);
      setPersonDetailsModalVisible(false);
  };

  // --- Render Functions ---
  const filteredTransactions = transactions.filter(t => 
    t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.note && t.note.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const renderTransaction = ({ item }) => (
    <View style={[styles.transactionCard, { backgroundColor: theme.card }]}>
      <View style={styles.transactionIcon}>
        <Ionicons 
          name={item.type === 'Income' ? 'arrow-up-circle' : 'arrow-down-circle'} 
          size={32} 
          color={item.type === 'Income' ? theme.success : theme.danger} 
        />
      </View>
      <View style={styles.transactionInfo}>
        <Text style={[styles.transactionCategory, { color: theme.text }]}>{item.category}</Text>
        {item.note ? <Text style={[styles.transactionNote, { color: theme.subText }]}>{item.note}</Text> : null}
        <Text style={[styles.transactionDate, { color: theme.subText }]}>{item.date}</Text>
      </View>
      <View style={styles.transactionAmountContainer}>
        <Text style={[styles.transactionAmount, { color: item.type === 'Income' ? theme.success : theme.danger }]}>
          {item.type === 'Income' ? '+' : '-'}₹{item.amount.toFixed(2)}
        </Text>
        <TouchableOpacity onPress={() => deleteTransaction(item.id)}>
          <Ionicons name="trash-outline" size={20} color={theme.subText} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderPerson = ({ item }) => (
    <TouchableOpacity 
      style={[styles.personCard, { backgroundColor: theme.card }]}
      onPress={() => {
        setSelectedPerson(item);
        setPersonDetailsModalVisible(true);
      }}
    >
      <View style={styles.personIcon}>
        <Ionicons name="person-circle" size={40} color={theme.primary} />
      </View>
      <View style={styles.personInfo}>
        <Text style={[styles.personName, { color: theme.text }]}>{item.name}</Text>
        <View style={styles.debtRow}>
           {item.owe > 0 && <Text style={[styles.debtText, { color: theme.danger }]}>I owe: ₹{item.owe.toFixed(2)}</Text>}
           {item.owed > 0 && <Text style={[styles.debtText, { color: theme.success }]}>Owes me: ₹{item.owed.toFixed(2)}</Text>}
           {item.owe === 0 && item.owed === 0 && <Text style={[styles.debtText, { color: theme.subText }]}>Settled</Text>}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={24} color={theme.subText} />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Money Manager</Text>
      </View>

      {viewMode === 'transactions' ? (
        <>
          <View style={[styles.summaryCard, { backgroundColor: theme.primary }]}>
            <View style={styles.balanceContainer}>
              <Text style={styles.balanceLabel}>Total Balance</Text>
              <Text style={styles.balanceAmount}>₹{balance.toFixed(2)}</Text>
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <View style={styles.statIconDown}>
                  <Ionicons name="arrow-down" size={16} color="#FFF" />
                </View>
                <View>
                  <Text style={styles.statLabel}>Income</Text>
                  <Text style={styles.incomeAmount}>+₹{income.toFixed(2)}</Text>
                </View>
              </View>
              <View style={styles.statItem}>
                <View style={styles.statIconUp}>
                  <Ionicons name="arrow-up" size={16} color="#FFF" />
                </View>
                <View>
                  <Text style={styles.statLabel}>Expense</Text>
                  <Text style={styles.expenseAmount}>-₹{expense.toFixed(2)}</Text>
                </View>
              </View>
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.managePeopleButton, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => setViewMode('people')}
          >
            <Ionicons name="people" size={20} color={theme.primary} />
            <Text style={[styles.managePeopleText, { color: theme.text }]}>Manage People / Debts</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.subText} />
          </TouchableOpacity>

          <View style={styles.transactionsContainer}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Transactions</Text>
              <TouchableOpacity onPress={() => setModalVisible(true)}>
                <Text style={[styles.seeAllText, { color: theme.primary }]}>+ Add</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.searchInput, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
              placeholder="Search transactions..."
              placeholderTextColor={theme.subText}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            <FlatList
              data={filteredTransactions}
              renderItem={renderTransaction}
              keyExtractor={item => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <Text style={[styles.emptyText, { color: theme.subText }]}>No transactions found</Text>
              }
            />
          </View>
        </>
      ) : (
        // People View
        <View style={styles.peopleContainer}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => setViewMode('transactions')}
          >
            <Ionicons name="arrow-back" size={24} color={theme.text} />
            <Text style={[styles.backButtonText, { color: theme.text }]}>Back to Transactions</Text>
          </TouchableOpacity>

          <View style={styles.sectionHeader}>
             <Text style={[styles.sectionTitle, { color: theme.text }]}>People & Debts</Text>
             <TouchableOpacity onPress={() => setAddPersonModalVisible(true)}>
                <Text style={[styles.seeAllText, { color: theme.primary }]}>+ Add Person</Text>
             </TouchableOpacity>
          </View>

          <FlatList
            data={people}
            renderItem={renderPerson}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <Text style={[styles.emptyText, { color: theme.subText }]}>No people added yet.</Text>
            }
          />
        </View>
      )}

      {/* Add Transaction Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[styles.modalView, { backgroundColor: theme.card }]}>
          <Text style={[styles.modalTitle, { color: theme.text }]}>Add Transaction</Text>
          
          <View style={styles.typeContainer}>
            <TouchableOpacity 
              style={[styles.typeButton, newType === 'Income' && { backgroundColor: theme.success }]} 
              onPress={() => setNewType('Income')}
            >
              <Text style={styles.typeText}>Income</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.typeButton, newType === 'Expense' && { backgroundColor: theme.danger }]} 
              onPress={() => setNewType('Expense')}
            >
              <Text style={styles.typeText}>Expense</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text }]}
            placeholder="Amount"
            placeholderTextColor={theme.subText}
            keyboardType="numeric"
            value={newAmount}
            onChangeText={setNewAmount}
          />
          <TextInput
            style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text }]}
            placeholder="Category (e.g., Food, Salary)"
            placeholderTextColor={theme.subText}
            value={newCategory}
            onChangeText={setNewCategory}
          />
          <TextInput
            style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text }]}
            placeholder="Note (optional)"
            placeholderTextColor={theme.subText}
            value={newNote}
            onChangeText={setNewNote}
          />

          <View style={styles.modalButtons}>
            <TouchableOpacity style={[styles.button, styles.buttonCancel]} onPress={() => setModalVisible(false)}>
              <Text style={styles.textStyle}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={handleAddTransaction}>
              <Text style={styles.textStyle}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Person Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={addPersonModalVisible}
        onRequestClose={() => setAddPersonModalVisible(false)}
      >
        <View style={[styles.modalView, { backgroundColor: theme.card }]}>
          <Text style={[styles.modalTitle, { color: theme.text }]}>Add Person</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text }]}
            placeholder="Name"
            placeholderTextColor={theme.subText}
            value={newPersonName}
            onChangeText={setNewPersonName}
          />
          <View style={styles.modalButtons}>
            <TouchableOpacity style={[styles.button, styles.buttonCancel]} onPress={() => setAddPersonModalVisible(false)}>
              <Text style={styles.textStyle}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={handleAddPerson}>
              <Text style={styles.textStyle}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Person Details Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={personDetailsModalVisible}
        onRequestClose={() => setPersonDetailsModalVisible(false)}
      >
        <View style={[styles.modalView, { backgroundColor: theme.card }]}>
          {selectedPerson && (
            <>
              <View style={styles.personDetailsHeader}>
                 <Text style={[styles.modalTitle, { color: theme.text }]}>{selectedPerson.name}</Text>
                 <TouchableOpacity onPress={() => deletePerson(selectedPerson.id)}>
                    <Ionicons name="trash" size={24} color={theme.danger} />
                 </TouchableOpacity>
              </View>
              
              <View style={styles.debtSummary}>
                <View style={styles.debtItem}>
                  <Text style={[styles.debtLabel, { color: theme.subText }]}>I Owe Them</Text>
                  <Text style={[styles.debtValue, { color: theme.danger }]}>₹{selectedPerson.owe.toFixed(2)}</Text>
                </View>
                <View style={styles.debtItem}>
                  <Text style={[styles.debtLabel, { color: theme.subText }]}>They Owe Me</Text>
                  <Text style={[styles.debtValue, { color: theme.success }]}>₹{selectedPerson.owed.toFixed(2)}</Text>
                </View>
              </View>

              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text }]}
                placeholder="Amount"
                placeholderTextColor={theme.subText}
                keyboardType="numeric"
                value={debtAmount}
                onChangeText={setDebtAmount}
              />

              <Text style={[styles.sectionTitle, { fontSize: 16, marginBottom: 10, color: theme.text }]}>Update Balance:</Text>
              
              <View style={styles.debtActions}>
                 <View style={styles.debtActionColumn}>
                    <Text style={[styles.debtActionLabel, {color: theme.subText}]}>My Debt (I Owe)</Text>
                    <TouchableOpacity style={[styles.debtButton, { backgroundColor: theme.danger }]} onPress={() => handleUpdateDebt('borrowed')}>
                       <Text style={styles.debtButtonText}>+ Borrowed</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.debtButton, { backgroundColor: theme.success }]} onPress={() => handleUpdateDebt('repaid')}>
                       <Text style={styles.debtButtonText}>- Repaid</Text>
                    </TouchableOpacity>
                 </View>
                 <View style={styles.debtActionColumn}>
                    <Text style={[styles.debtActionLabel, {color: theme.subText}]}>Their Debt (Owes Me)</Text>
                    <TouchableOpacity style={[styles.debtButton, { backgroundColor: theme.success }]} onPress={() => handleUpdateDebt('lent')}>
                       <Text style={styles.debtButtonText}>+ Lent</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.debtButton, { backgroundColor: theme.danger }]} onPress={() => handleUpdateDebt('received')}>
                       <Text style={styles.debtButtonText}>- Received</Text>
                    </TouchableOpacity>
                 </View>
              </View>

              <TouchableOpacity style={[styles.button, styles.buttonCancel, { width: '100%', marginTop: 20 }]} onPress={() => setPersonDetailsModalVisible(false)}>
                <Text style={styles.textStyle}>Close</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 50,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  summaryCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  balanceContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginBottom: 5,
  },
  balanceAmount: {
    color: '#FFF',
    fontSize: 36,
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 10,
    borderRadius: 12,
    width: '48%',
  },
  statIconDown: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  statIconUp: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  incomeAmount: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  expenseAmount: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  transactionsContainer: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  seeAllText: {
    fontWeight: 'bold',
  },
  searchInput: {
    height: 40,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    borderWidth: 1,
  },
  listContent: {
    paddingBottom: 100,
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
  },
  transactionIcon: {
    marginRight: 15,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionCategory: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  transactionNote: {
    fontSize: 12,
    marginBottom: 4,
    fontStyle: 'italic',
  },
  transactionDate: {
    fontSize: 12,
  },
  transactionAmountContainer: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontStyle: 'italic',
  },
  modalView: {
    margin: 20,
    marginTop: 150,
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  typeContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    width: '100%',
    justifyContent: 'space-between',
  },
  typeButton: {
    padding: 10,
    borderRadius: 10,
    width: '48%',
    alignItems: 'center',
    backgroundColor: '#ccc',
  },
  typeText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  input: {
    width: '100%',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
  button: {
    borderRadius: 10,
    padding: 15,
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
    textAlign: 'center',
  },
  managePeopleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
  },
  managePeopleText: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    marginLeft: 10,
  },
  peopleContainer: {
    flex: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  backButtonText: {
    fontSize: 16,
    marginLeft: 5,
  },
  personCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
  },
  personIcon: {
    marginRight: 15,
  },
  personInfo: {
    flex: 1,
  },
  personName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  debtRow: {
    flexDirection: 'row',
    marginTop: 5,
  },
  debtText: {
    fontSize: 14,
    marginRight: 10,
    fontWeight: '500',
  },
  personDetailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  debtSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  debtItem: {
    alignItems: 'center',
    width: '48%',
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 10,
  },
  debtLabel: {
    fontSize: 12,
    marginBottom: 5,
  },
  debtValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  debtActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 10,
  },
  debtActionColumn: {
    width: '48%',
  },
  debtActionLabel: {
    fontSize: 12,
    marginBottom: 5,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  debtButton: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  debtButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
});
